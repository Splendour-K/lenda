import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { CURRENCIES, EXCHANGE_RATES } from '../utils/constants';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState('GHS'); // Default to GHS
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user ?? null);
      if (session?.user) fetchUserProfile(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null);
      if (session?.user) fetchUserProfile(session.user.id);
      else setUserProfile(null);
    });

    fetchItems();
    detectLocation();
    return () => subscription.unsubscribe();
  }, []);

  const detectLocation = async () => {
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      if (data.country_code === 'NG') {
        setCurrency('NGN');
      } else {
        setCurrency('GHS'); // Default to GHS for Ghana and others
      }
    } catch (error) {
      console.error('Error detecting location:', error);
      setCurrency('GHS');
    }
  };

  const formatPrice = (price, itemCurrency = 'GHS') => {
    // Convert itemPrice from itemCurrency to base (GHS) then to selected currency
    const priceInBase = price / (EXCHANGE_RATES[itemCurrency] || 1);
    const convertedPrice = priceInBase * (EXCHANGE_RATES[currency] || 1);
    
    return `${CURRENCIES[currency]?.symbol || ''}${convertedPrice.toFixed(2)}`;
  };

  useEffect(() => {
    if (currentUser) {
      fetchTransactions();
    }
  }, [currentUser]);

  const fetchUserProfile = async (userId) => {
    const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();
    if (data) {
      setUserProfile(data);
    } else if (error && error.code === 'PGRST116') {
      // Row not found. Let's create the missing profile.
      const userRes = await supabase.auth.getUser();
      const user = userRes.data?.user;
      if (user && user.id === userId) {
        const defaultName = user.email ? user.email.split('@')[0] : 'User';
        const { error: insertError } = await supabase.from('users').insert([
          { 
            id: userId, 
            name: defaultName, 
            university: null,
            avatar: 'https://storage.googleapis.com/banani-avatars/avatar%2Fmale%2F18-25%2FEuropean%2F1' 
          }
        ]);
        if (!insertError) {
          const { data: newData } = await supabase.from('users').select('*').eq('id', userId).single();
          if (newData) setUserProfile(newData);
        }
      }
    }
  };

  const fetchItems = async () => {
    const { data, error } = await supabase
      .from('items')
      .select('*, owner:owner_id(name, avatar, is_verified, rating, university)')
      .eq('status', 'Available')
      .order('created_at', { ascending: false });
    
    if (data) setItems(data);
  };

  const fetchTransactions = async () => {
    if (!currentUser) return;
    const { data, error } = await supabase
      .from('transactions')
      .select('*, item:item_id(title, category, owner_id)')
      .or(`borrower_id.eq.${currentUser.id}, item_id.in.(select id from items where owner_id = '${currentUser.id}')`)
      .order('created_at', { ascending: false });
    
    if (data) setTransactions(data);
  };

  const addItem = async (itemData) => {
    if (!currentUser) return alert('Please login first');
    const { data, error } = await supabase.from('items').insert([
      { ...itemData, owner_id: currentUser.id }
    ]).select();
    if (error) {
      alert('Error adding item: ' + error.message);
      return false;
    }
    fetchItems();
    return true;
  };

  const requestToBorrow = async (itemId, startDate, endDate, totalPrice) => {
    if (!currentUser) return alert('Please login first');
    const { data, error } = await supabase.from('transactions').insert([
      {
        item_id: itemId,
        borrower_id: currentUser.id,
        start_date: startDate,
        end_date: endDate,
        total_price: totalPrice,
        status: 'Requested'
      }
    ]);
    if (error) {
      alert('Error requesting item: ' + error.message);
      return false;
    }
    fetchTransactions();
    alert('Request sent to owner!');
    return true;
  };

  const updateTransactionStatus = async (id, newStatus) => {
    const { data, error } = await supabase
      .from('transactions')
      .update({ status: newStatus })
      .eq('id', id);
    if (!error) fetchTransactions();
  };

  const signIn = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email, password, name, university, avatarFile) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    if (data.user) {
      let avatarUrl = 'https://storage.googleapis.com/banani-avatars/avatar%2Fmale%2F18-25%2FEuropean%2F1';
      
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${data.user.id}-${Math.random()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatarFile);
          
        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
          avatarUrl = publicUrlData.publicUrl;
        } else {
          console.error("Avatar upload failed during signup:", uploadError);
        }
      }

      // Create user profile
      await supabase.from('users').insert([
        { id: data.user.id, name, university, avatar: avatarUrl }
      ]);
      fetchUserProfile(data.user.id);
    }
  };

  const updateProfile = async (updates, avatarFile) => {
    if (!currentUser) return false;
    let newAvatarUrl = userProfile?.avatar;

    if (avatarFile) {
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${currentUser.id}-${Math.random()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, avatarFile);
        
      if (!uploadError) {
        const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
        newAvatarUrl = publicUrlData.publicUrl;
      } else {
        alert("Avatar upload failed: " + uploadError.message);
        return false;
      }
    }

    const finalUpdates = {
      ...updates,
      avatar: newAvatarUrl
    };

    const { error } = await supabase
      .from('users')
      .update(finalUpdates)
      .eq('id', currentUser.id);

    if (error) {
      alert("Error updating profile: " + error.message);
      return false;
    }
    
    await fetchUserProfile(currentUser.id);
    return true;
  };

  const addReview = async (transactionId, revieweeId, rating, comment) => {
    if (!currentUser) return false;
    const { data, error } = await supabase.from('reviews').insert([
      {
        transaction_id: transactionId,
        reviewer_id: currentUser.id,
        reviewee_id: revieweeId,
        rating,
        comment
      }
    ]);
    if (error) {
      alert("Error adding review: " + error.message);
      return false;
    }
    // Might want to fetch user profile again or transactions if needed
    return true;
  };

  const signOut = () => supabase.auth.signOut();

  return (
    <AppContext.Provider value={{
      items,
      currentUser,
      userProfile,
      transactions,
      signIn,
      signUp,
      signOut,
      addItem,
      requestToBorrow,
      updateTransactionStatus,
      updateProfile,
      addReview,
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
