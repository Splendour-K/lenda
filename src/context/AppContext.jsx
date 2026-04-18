import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { CURRENCIES, EXCHANGE_RATES } from '../utils/constants';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState('GHS');
  const [searchQuery, setSearchQuery] = useState('');
  // Active dashboard role: 'borrower' or 'lender'
  const [activeRole, setActiveRole] = useState('borrower');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user ?? null);
      if (session?.user) fetchUserProfile(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null);
      if (session?.user) fetchUserProfile(session.user.id);
      else { setUserProfile(null); setNotifications([]); }
    });

    fetchItems();
    detectLocation();
    return () => subscription.unsubscribe();
  }, []);

  // Subscribe to realtime notifications when user is known
  useEffect(() => {
    if (!currentUser) return;
    fetchTransactions();
    fetchNotifications();

    const channel = supabase
      .channel(`notifications:${currentUser.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${currentUser.id}`
      }, (payload) => {
        setNotifications(prev => [payload.new, ...prev]);
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [currentUser]);

  // Sync activeRole from userProfile when profile loads
  useEffect(() => {
    if (userProfile?.role) setActiveRole(userProfile.role);
  }, [userProfile]);

  const detectLocation = async () => {
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      setCurrency(data.country_code === 'NG' ? 'NGN' : 'GHS');
    } catch {
      setCurrency('GHS');
    }
  };

  const formatPrice = (price, itemCurrency = 'GHS') => {
    const priceInBase = price / (EXCHANGE_RATES[itemCurrency] || 1);
    const convertedPrice = priceInBase * (EXCHANGE_RATES[currency] || 1);
    return `${CURRENCIES[currency]?.symbol || ''}${convertedPrice.toFixed(2)}`;
  };

  const fetchUserProfile = async (userId) => {
    const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();
    if (data) {
      setUserProfile(data);
    } else if (error && error.code === 'PGRST116') {
      const userRes = await supabase.auth.getUser();
      const user = userRes.data?.user;
      if (user && user.id === userId) {
        const defaultName = user.email ? user.email.split('@')[0] : 'User';
        const { error: insertError } = await supabase.from('users').insert([{
          id: userId,
          name: defaultName,
          university: null,
          role: 'borrower',
          avatar: null
        }]);
        if (!insertError) {
          const { data: newData } = await supabase.from('users').select('*').eq('id', userId).single();
          if (newData) setUserProfile(newData);
        }
      }
    }
  };

  const fetchItems = async () => {
    const { data } = await supabase
      .from('items')
      .select('*, owner:owner_id(name, avatar, is_verified, rating, university)')
      .eq('status', 'Available')
      .order('created_at', { ascending: false });
    if (data) setItems(data);
  };

  const fetchTransactions = async () => {
    if (!currentUser) return;
    const { data } = await supabase
      .from('transactions')
      .select('*, item:item_id(title, category, owner_id), borrower:borrower_id(name, avatar)')
      .or(`borrower_id.eq.${currentUser.id}, item_id.in.(select id from items where owner_id = '${currentUser.id}')`)
      .order('created_at', { ascending: false });
    if (data) setTransactions(data);
  };

  const fetchNotifications = async () => {
    if (!currentUser) return;
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false })
      .limit(30);
    if (data) setNotifications(data);
  };

  const markNotificationRead = async (id) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllRead = async () => {
    if (!currentUser) return;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', currentUser.id).eq('is_read', false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const addItem = async (itemData) => {
    if (!currentUser) return alert('Please login first');
    const { error } = await supabase.from('items').insert([{ ...itemData, owner_id: currentUser.id }]).select();
    if (error) { alert('Error adding item: ' + error.message); return false; }
    fetchItems();
    return true;
  };

  const requestToBorrow = async (itemId, startDate, endDate, totalPrice) => {
    if (!currentUser) return alert('Please login first');

    // Generate 5-digit OTP
    const otp = String(Math.floor(10000 + Math.random() * 90000));

    const { data: txData, error } = await supabase.from('transactions').insert([{
      item_id: itemId,
      borrower_id: currentUser.id,
      start_date: startDate,
      end_date: endDate,
      total_price: totalPrice,
      status: 'Requested',
      otp_code: otp
    }]).select('*, item:item_id(title, owner_id)').single();

    if (error) { alert('Error requesting item: ' + error.message); return false; }

    const ownerId = txData?.item?.owner_id;
    const itemTitle = txData?.item?.title || 'an item';

    // Notify borrower with OTP
    await supabase.from('notifications').insert([{
      user_id: currentUser.id,
      title: 'Request Sent ✅',
      body: `Your request for "${itemTitle}" was sent. Your handover code is: ${otp}`
    }]);

    // Notify lender
    if (ownerId) {
      await supabase.from('notifications').insert([{
        user_id: ownerId,
        title: 'New Rental Request 🔔',
        body: `Someone requested to borrow "${itemTitle}". Check your dashboard to respond.`
      }]);
    }

    fetchTransactions();
    return { success: true, otp };
  };

  const verifyOTP = async (transactionId, inputCode) => {
    const txn = transactions.find(t => t.id === transactionId);
    if (!txn) return { success: false, error: 'Transaction not found.' };
    if (txn.otp_code !== String(inputCode)) return { success: false, error: 'Incorrect code. Please try again.' };

    const { error } = await supabase.from('transactions').update({ status: 'Delivered' }).eq('id', transactionId);
    if (error) return { success: false, error: error.message };

    // Notify both parties
    const itemTitle = txn.item?.title || 'the item';
    await supabase.from('notifications').insert([
      { user_id: currentUser.id, title: 'Delivery Confirmed ✅', body: `"${itemTitle}" has been marked as Delivered.` },
      { user_id: txn.borrower_id, title: 'Item Delivered ✅', body: `"${itemTitle}" has been confirmed as delivered to you!` }
    ]);

    fetchTransactions();
    return { success: true };
  };

  const updateTransactionStatus = async (id, newStatus) => {
    const { error } = await supabase.from('transactions').update({ status: newStatus }).eq('id', id);
    if (!error) fetchTransactions();
  };

  const signIn = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email, password, name, university, role, avatarFile) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    if (data.user) {
      let avatarUrl = null;
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${data.user.id}-${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, avatarFile);
        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
          avatarUrl = publicUrlData.publicUrl;
        } else {
          console.error('Avatar upload failed during signup:', uploadError);
        }
      }
      await supabase.from('users').insert([{ id: data.user.id, name, university, role, avatar: avatarUrl }]);
      fetchUserProfile(data.user.id);
    }
  };

  const updateProfile = async (updates, avatarFile) => {
    if (!currentUser) return false;
    let newAvatarUrl = userProfile?.avatar;
    if (avatarFile) {
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${currentUser.id}-${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, avatarFile);
      if (!uploadError) {
        const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
        newAvatarUrl = publicUrlData.publicUrl;
      } else {
        alert('Avatar upload failed: ' + uploadError.message);
        return false;
      }
    }
    const { error } = await supabase.from('users').update({ ...updates, avatar: newAvatarUrl }).eq('id', currentUser.id);
    if (error) { alert('Error updating profile: ' + error.message); return false; }
    await fetchUserProfile(currentUser.id);
    return true;
  };

  const switchRole = async (newRole) => {
    setActiveRole(newRole);
    // Persist role preference to profile
    await supabase.from('users').update({ role: newRole }).eq('id', currentUser.id);
    await fetchUserProfile(currentUser.id);
  };

  const addReview = async (transactionId, revieweeId, rating, comment) => {
    if (!currentUser) return false;
    const { error } = await supabase.from('reviews').insert([{
      transaction_id: transactionId,
      reviewer_id: currentUser.id,
      reviewee_id: revieweeId,
      rating,
      comment
    }]);
    if (error) { alert('Error adding review: ' + error.message); return false; }
    return true;
  };

  const signOut = () => supabase.auth.signOut();

  return (
    <AppContext.Provider value={{
      items,
      currentUser,
      userProfile,
      transactions,
      notifications,
      signIn,
      signUp,
      signOut,
      addItem,
      requestToBorrow,
      updateTransactionStatus,
      updateProfile,
      addReview,
      verifyOTP,
      markNotificationRead,
      markAllRead,
      fetchTransactions,
      activeRole,
      switchRole,
      searchQuery,
      setSearchQuery,
      currency,
      setCurrency,
      formatPrice
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
