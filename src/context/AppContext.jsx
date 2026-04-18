/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { CURRENCIES, EXCHANGE_RATES } from '../utils/constants';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [notifications, setNotifications] = useState([]);
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  useEffect(() => {
    if (userProfile?.role) setActiveRole(userProfile.role);
  }, [userProfile]);

  async function detectLocation() {
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      setCurrency(data.country_code === 'NG' ? 'NGN' : 'GHS');
    } catch {
      setCurrency('GHS');
    }
  };

  function formatPrice(price, itemCurrency = 'GHS') {
    const priceInBase = price / (EXCHANGE_RATES[itemCurrency] || 1);
    const convertedPrice = priceInBase * (EXCHANGE_RATES[currency] || 1);
    return `${CURRENCIES[currency]?.symbol || ''}${convertedPrice.toFixed(2)}`;
  };

  async function fetchUserProfile(userId) {
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

  async function fetchItems() {
    const { data } = await supabase
      .from('items')
      .select('*, owner:owner_id(name, avatar, is_verified, rating, university)')
      .eq('status', 'Available');
    
    if (data) {
      // Sort: Sponsored items first, then by created_at desc
      const sorted = [...data].sort((a, b) => {
        if (a.is_sponsored && !b.is_sponsored) return -1;
        if (!a.is_sponsored && b.is_sponsored) return 1;
        return new Date(b.created_at) - new Date(a.created_at);
      });
      setItems(sorted);
    }
  };

  /* ─────────────────────────────────────────
     Admin & Advanced Functions
  ───────────────────────────────────────── */
  
  const adminFetchAllUsers = async () => {
    const { data } = await supabase.from('users').select('*').order('created_at', { ascending: false });
    return data || [];
  };

  const adminUpdateUser = async (id, updates) => {
    const { error } = await supabase.from('users').update(updates).eq('id', id);
    if (error) throw error;
    fetchUserProfile(currentUser?.id); // Refresh if self
  };

  const adminDeleteUser = async (id) => {
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) throw error;
  };

  const adminFetchAllItems = async () => {
    const { data } = await supabase
      .from('items')
      .select('*, owner:owner_id(name, email, university)')
      .order('created_at', { ascending: false });
    return data || [];
  };

  const adminUpdateItem = async (id, updates) => {
    const { error } = await supabase.from('items').update(updates).eq('id', id);
    if (error) throw error;
    fetchItems();
  };

  const adminFetchAllTransactions = async () => {
    const { data } = await supabase
      .from('transactions')
      .select('*, item:item_id(title, owner_id), borrower:borrower_id(name)')
      .order('created_at', { ascending: false });
    return data || [];
  };

  const requestSponsorship = async (itemId) => {
    const { error } = await supabase.from('items').update({ sponsor_requested: true }).eq('id', itemId);
    if (error) throw error;
    fetchItems();
  };

  async function fetchTransactions() {
    if (!currentUser) return;
    const { data } = await supabase
      .from('transactions')
      .select('*, item:item_id(title, category, owner_id), borrower:borrower_id(name, avatar)')
      .or(`borrower_id.eq.${currentUser.id}, item_id.in.(select id from items where owner_id = '${currentUser.id}')`)
      .order('created_at', { ascending: false });
    if (data) setTransactions(data);
  };

  async function fetchNotifications() {
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
    const txnId = txData?.id;
    const txnLink = `/transaction/${txnId}`;

    // Notify borrower with OTP + deep link
    await supabase.from('notifications').insert([{
      user_id: currentUser.id,
      title: 'Request Sent ✅',
      body: `Your request for "${itemTitle}" was sent. Your handover code is: ${otp}`,
      transaction_id: txnId,
      link: txnLink
    }]);

    // Notify lender with deep link to full request detail
    if (ownerId) {
      await supabase.from('notifications').insert([{
        user_id: ownerId,
        title: 'New Rental Request 🔔',
        body: `Someone requested to borrow "${itemTitle}". Tap to review and respond.`,
        transaction_id: txnId,
        link: txnLink
      }]);
    }

    fetchTransactions();
    return { success: true, otp };
  };

  const verifyOTP = async (transactionId, inputCode) => {
    // Pull fresh data from DB to check live state (not stale local state)
    const { data: txn, error: fetchErr } = await supabase
      .from('transactions')
      .select('*, item:item_id(title, owner_id)')
      .eq('id', transactionId)
      .single();

    if (fetchErr || !txn) return { success: false, error: 'Transaction not found.' };

    // Lifecycle guard: only Accepted transactions can be verified
    if (!['Requested', 'Accepted'].includes(txn.status)) {
      return { success: false, error: `Cannot verify a transaction with status "${txn.status}".` };
    }

    // Reuse guard
    if (txn.otp_used) {
      return { success: false, error: 'This code has already been used and cannot be reused.' };
    }

    // Max-attempts guard (allow up to 5 tries)
    if ((txn.otp_attempts || 0) >= 5) {
      return { success: false, error: 'Maximum verification attempts reached. Contact support.' };
    }

    const isCorrect = txn.otp_code === String(inputCode).trim();
    const newAttempts = (txn.otp_attempts || 0) + 1;

    // Always log the attempt
    await supabase.from('verification_logs').insert([{
      transaction_id: transactionId,
      attempted_by: currentUser.id,
      input_code: String(inputCode).trim(),
      is_success: isCorrect,
      otp_attempts_at_time: newAttempts
    }]);

    if (!isCorrect) {
      // Increment attempt counter in DB
      await supabase.from('transactions').update({ otp_attempts: newAttempts }).eq('id', transactionId);
      const remaining = 5 - newAttempts;
      return {
        success: false,
        error: remaining > 0
          ? `Incorrect code. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`
          : 'Incorrect code. Maximum attempts reached. Contact support.'
      };
    }

    // ✅ Code is correct — update transaction to Delivered and lock OTP
    const { error: updateErr } = await supabase.from('transactions').update({
      status: 'Delivered',
      otp_used: true,
      otp_attempts: newAttempts,
      otp_verified_at: new Date().toISOString()
    }).eq('id', transactionId);

    if (updateErr) return { success: false, error: updateErr.message };

    // Notify both parties in real time
    const itemTitle = txn.item?.title || 'the item';
    const txnLink = `/transaction/${transactionId}`;
    const notifPayload = [
      {
        user_id: currentUser.id,
        title: 'Delivery Confirmed ✅',
        body: `You verified delivery of "${itemTitle}". The transaction is now locked.`,
        transaction_id: transactionId,
        link: txnLink
      }
    ];
    if (txn.borrower_id) {
      notifPayload.push({
        user_id: txn.borrower_id,
        title: 'Item Delivered ✅',
        body: `"${itemTitle}" has been confirmed as delivered to you!`,
        transaction_id: transactionId,
        link: txnLink
      });
    }
    await supabase.from('notifications').insert(notifPayload);

    fetchTransactions();
    return { success: true };
  };

  // Lender accepts a Requested transaction → moves to Accepted
  const acceptRequest = async (transactionId) => {
    const { data: txn } = await supabase
      .from('transactions')
      .select('*, item:item_id(title, owner_id)')
      .eq('id', transactionId)
      .single();

    if (!txn) return { success: false, error: 'Transaction not found.' };
    if (txn.status !== 'Requested') return { success: false, error: 'Only Requested transactions can be accepted.' };

    const { error } = await supabase.from('transactions').update({ status: 'Accepted' }).eq('id', transactionId);
    if (error) return { success: false, error: error.message };

    const itemTitle = txn.item?.title || 'an item';
    const txnLink = `/transaction/${transactionId}`;
    await supabase.from('notifications').insert([{
      user_id: txn.borrower_id,
      title: 'Request Accepted! 🎉',
      body: `Your request for "${itemTitle}" was accepted. Your code: ${txn.otp_code}`,
      transaction_id: transactionId,
      link: txnLink
    }]);

    fetchTransactions();
    return { success: true };
  };

  // Lender rejects a Requested transaction
  const rejectRequest = async (transactionId) => {
    const { data: txn } = await supabase
      .from('transactions')
      .select('*, item:item_id(title)')
      .eq('id', transactionId)
      .single();

    if (!txn || txn.status !== 'Requested') return { success: false, error: 'Cannot reject this transaction.' };

    const { error } = await supabase.from('transactions').update({ status: 'Rejected' }).eq('id', transactionId);
    if (error) return { success: false, error: error.message };

    await supabase.from('notifications').insert([{
      user_id: txn.borrower_id,
      title: 'Request Declined',
      body: `Your request for "${txn.item?.title || 'an item'}" was declined by the lender.`,
      transaction_id: transactionId,
      link: `/transaction/${transactionId}`
    }]);

    fetchTransactions();
    return { success: true };
  };

  // Log a notification click for audit trail
  const logNotificationClick = async (notificationId) => {
    if (!currentUser) return;
    await supabase.from('notification_click_logs').insert([{
      notification_id: notificationId,
      user_id: currentUser.id
    }]);
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
      acceptRequest,
      rejectRequest,
      markNotificationRead,
      markAllRead,
      logNotificationClick,
      fetchTransactions,
      activeRole,
      switchRole,
      searchQuery,
      setSearchQuery,
      currency,
      setCurrency,
      formatPrice,
      adminFetchAllUsers,
      adminUpdateUser,
      adminDeleteUser,
      adminFetchAllItems,
      adminUpdateItem,
      adminFetchAllTransactions,
      requestSponsorship
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
