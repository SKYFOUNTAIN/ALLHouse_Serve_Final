// Entire ChatsScreen.js with separated tab buttons and no container box
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, SafeAreaView, StyleSheet,
  TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, Modal, Pressable, FlatList
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth, db } from '../firebase/firebase';
import {
  collection, onSnapshot, addDoc, serverTimestamp,
  query, orderBy, doc, getDoc, deleteDoc, updateDoc
} from 'firebase/firestore';

export default function ChatsScreen() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState('general');
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userHouse, setUserHouse] = useState(null);

  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedMsg, setSelectedMsg] = useState(null);

  const flatListRef = useRef(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    getDoc(doc(db, 'users', user.uid)).then(docSnap => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setIsAdmin(data.isAdmin === true);
        setUserHouse(data.house || null);
      }
    });
  }, []);

  useEffect(() => {
    if (tab === 'general') {
      const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
      return onSnapshot(q, snapshot => {
        const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMessages(msgs);
      });
    } else if (userHouse) {
      const q = query(collection(db, `houseChats/${userHouse}/messages`), orderBy('createdAt', 'desc'));
      return onSnapshot(q, snapshot => {
        const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMessages(msgs);
      });
    }
  }, [tab, userHouse]);

  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  }, [messages]);

  const postMessage = async () => {
    if (!newMessage.trim()) return Alert.alert('Empty message');

    setLoading(true);
    const user = auth.currentUser;
    if (!user) return;

    const msgData = {
      text: newMessage.trim(),
      createdAt: serverTimestamp(),
      author: user.email || 'Admin',
      pinned: false
    };

    try {
      if (tab === 'general') {
        await addDoc(collection(db, 'announcements'), msgData);
      } else {
        await addDoc(collection(db, `houseChats/${userHouse}/messages`), msgData);
      }
      setNewMessage('');
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteMessage = async (id) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this message?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        onPress: async () => {
          const ref = tab === 'general'
            ? doc(db, 'announcements', id)
            : doc(db, `houseChats/${userHouse}/messages`, id);
          await deleteDoc(ref);
          setMenuVisible(false);
        }
      }
    ]);
  };

  const togglePin = async (id, pinned) => {
    const ref = tab === 'general'
      ? doc(db, 'announcements', id)
      : doc(db, `houseChats/${userHouse}/messages`, id);
    await updateDoc(ref, { pinned: !pinned });
    setMenuVisible(false);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
  };

  const pinnedMessages = messages
    .filter(m => m.pinned)
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  const unpinnedMessages = messages
    .filter(m => !m.pinned)
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  const combinedMessages = [...pinnedMessages, ...unpinnedMessages];

  const renderItem = ({ item }) => (
    <View style={styles.announcementCard}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={styles.announcementText}>{item.pinned ? '📌 ' : ''}{item.text}</Text>
        {isAdmin && (
          <TouchableOpacity onPress={() => openMenu(item)} style={styles.menuButton}>
            <Text style={{ fontSize: 24, color: '#666' }}>⋮</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.announcementFooter}>
        <Text style={styles.author}>{item.author}</Text>
        <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
      </View>
    </View>
  );

  const openMenu = (msg) => {
    setSelectedMsg(msg);
    setMenuVisible(true);
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top, backgroundColor: userHouse ? getHouseColor(userHouse) : '#f9f9fb' }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerText}>Announcements</Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            onPress={() => setTab('general')}
            style={[styles.tabCircle, tab === 'general' && styles.tabCircleActive]}
          >
            <Text style={[styles.tabText, tab === 'general' && styles.tabTextActive]}>General</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setTab('house')}
            style={[styles.tabCircle, tab === 'house' && styles.tabCircleActive]}
          >
            <Text style={[styles.tabText, tab === 'house' && styles.tabTextActive]}>
              {userHouse || 'Your House'}
            </Text>
          </TouchableOpacity>
        </View>

        <FlatList
          ref={flatListRef}
          style={styles.scroll}
          contentContainerStyle={{ paddingBottom: 80 }}
          data={combinedMessages}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          inverted
          keyboardShouldPersistTaps="handled"
        />

        {((tab === 'general' && isAdmin) || (tab === 'house' && isAdmin)) && (
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Write a message..."
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
              editable={!loading}
            />
            <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={postMessage} disabled={loading}>
              <Text style={styles.buttonText}>{loading ? 'Posting...' : 'Send'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Modal */}
        <Modal
          visible={menuVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setMenuVisible(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setMenuVisible(false)}>
            <View style={styles.menuContainer}>
              <TouchableOpacity
                onPress={() => togglePin(selectedMsg.id, selectedMsg.pinned)}
                style={styles.menuItem}
              >
                <Text style={styles.menuText}>{selectedMsg?.pinned ? 'Unpin Message' : 'Pin Message'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => deleteMessage(selectedMsg.id)}
                style={[styles.menuItem, { borderTopWidth: 1, borderColor: '#ddd' }]}
              >
                <Text style={[styles.menuText, { color: '#c0392b' }]}>Delete Message</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function getHouseColor(houseName) {
  switch (houseName) {
    case 'Red': return '#e74c3c';
    case 'Blue': return '#3498db';
    case 'Green': return '#2ecc71';
    case 'Yellow': return '#FFD700';
    case 'Black': return '#333333';
    default: return '#f9f9fb';
  }
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { alignItems: 'center', marginVertical: 10 },
  headerText: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
    gap: 24, // spacing between buttons
  },
  tabCircle: {
    paddingVertical: 6,
    paddingHorizontal: 18,
    borderRadius: 50,
    backgroundColor: '#ccc',
  },
  tabCircleActive: {
    backgroundColor: '#6C63FF',
  },
  tabText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#fff',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  scroll: { flex: 1, paddingHorizontal: 16 },
  noAnnouncements: { textAlign: 'center', color: '#fff', marginTop: 20 },
  announcementCard: {
    backgroundColor: '#ffffffcc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  announcementText: { fontSize: 16, color: '#333', flex: 1 },
  announcementFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  author: { fontSize: 12, color: '#555', fontStyle: 'italic' },
  date: { fontSize: 12, color: '#555' },
  menuButton: {
    paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderColor: '#ddd',
  },
  input: {
    minHeight: 60,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: '#bbb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    marginBottom: 8,
    backgroundColor: '#fafafa',
  },
  button: {
    backgroundColor: '#6C63FF',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonDisabled: { backgroundColor: '#a39cff' },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#00000066',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    width: 220,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    elevation: 5,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuText: {
    fontSize: 16,
  },
});
