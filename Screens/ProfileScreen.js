import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, TouchableOpacity, ScrollView, Image, Alert, StyleSheet, SafeAreaView, Modal, TextInput, KeyboardAvoidingView, Platform 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { FontAwesome } from '@expo/vector-icons';
import { auth, db } from '../firebase/firebase';
import { onAuthStateChanged, signOut, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { Checkbox } from 'react-native-paper';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [userData, setUserData] = useState({
    name: 'Loading...',
    house: '',
    eventsSignedUp: 0,
    eventWins: 0,
    interests: {},
    email: '',
  });

  // Modal states for change password
  const [modalVisible, setModalVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [loadingPassword, setLoadingPassword] = useState(false);

  // Modal states for edit profile
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editInterests, setEditInterests] = useState({ boardGames: false, sports: false });
  const [savingProfile, setSavingProfile] = useState(false);

  const houseColors = {
    Red: '#e74c3c',
    Blue: '#3498db',
    Green: '#2ecc71',
    Yellow: '#f1c40f',
    Black: '#2c3e50',
  };

  // Load user data on auth state change
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          const rawName = user.email.split('@')[0].replace(/_/g, ' ');
          const name = rawName
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
          setUserData({
            name,
            house: data.house || '',
            interests: data.interests || {},
            eventsSignedUp: data.eventsAttended || 0,
            eventWins: data.eventsWon || 0,
            email: user.email,
          });
          setEditInterests(data.interests || { boardGames: false, sports: false });
        }
      } catch (err) {
        console.error('Error loading profile:', err);
      }
    });

    return () => unsubscribe();
  }, []);

  useFocusEffect(
    useCallback(() => {
      navigation.setOptions({ title: 'Profile' });
    }, [navigation])
  );

  const currentHouseColor = houseColors[userData.house] || '#888';

  const calculateXP = (events) => events * 50;

  const achievements = [
    { title: 'First Event', unlocked: userData.eventsSignedUp >= 1 },
    { title: '5 Events Attended', unlocked: userData.eventsSignedUp >= 5 },
    { title: 'Champion!', unlocked: userData.eventWins >= 1 },
    { title: '3 Wins', unlocked: userData.eventWins >= 3 },
  ];

  const handleLogout = () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log Out",
          onPress: async () => {
            try {
              await signOut(auth);
              navigation.replace('Login');
            } catch (error) {
              console.error("Sign out error:", error);
              Alert.alert("Error", "Failed to sign out. Please try again.");
            }
          }
        }
      ]
    );
  };

  // Change Password Handlers
  const reauthenticate = async (currentPassword) => {
    const user = auth.currentUser;
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    return reauthenticateWithCredential(user, credential);
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert("Error", "New password should be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      Alert.alert("Error", "New password and confirmation do not match.");
      return;
    }
    setLoadingPassword(true);
    try {
      await reauthenticate(currentPassword);
      await updatePassword(auth.currentUser, newPassword);
      Alert.alert("Success", "Password changed successfully.");
      setModalVisible(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error) {
      console.error("Change password error:", error);
      Alert.alert("Error", error.message || "Failed to change password.");
    } finally {
      setLoadingPassword(false);
    }
  };

  // Edit Profile Handlers
  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not logged in');

      await updateDoc(doc(db, 'users', user.uid), {
        interests: editInterests,
      });

      setUserData((prev) => ({
        ...prev,
        interests: editInterests,
      }));

      Alert.alert('Success', 'Profile updated successfully.');
      setEditModalVisible(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', error.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top + 20, backgroundColor: currentHouseColor }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 100, paddingHorizontal: 20 }}>
        {/* Header Card */}
        <View style={[styles.headerCard, { borderColor: currentHouseColor }]}>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <FontAwesome name="sign-out" size={22} color="#fff" />
          </TouchableOpacity>

          <View style={[styles.avatarWrapper, { borderColor: currentHouseColor }]}>
            <Image
              source={{ uri: 'https://cdn-icons-png.flaticon.com/512/149/149071.png' }}
              style={styles.avatar}
            />
          </View>

          <Text style={styles.name}>{userData.name}</Text>
          <View style={[styles.houseBadge, { backgroundColor: currentHouseColor + '33' }]}>
            <Text style={[styles.houseText, { color: currentHouseColor }]}>{userData.house} House</Text>
          </View>
        </View>

        {/* Overview Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>📊 Overview</Text>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Events Attended</Text>
            <Text style={styles.statValue}>{userData.eventsSignedUp}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>XP</Text>
            <Text style={styles.statValue}>{calculateXP(userData.eventsSignedUp)}</Text>
          </View>

          {/* Interests Display */}
          <View style={{ marginTop: 15 }}>
            <Text style={styles.sectionTitle}>🎯 Interests</Text>
            {(() => {
              const selected = Object.entries(userData.interests)
                .filter(([_, val]) => val === true)
                .map(([key]) => {
                  switch (key) {
                    case 'boardGames': return '♟️ Board Games';
                    case 'sports': return '⚽ Sports';
                    default: return null;
                  }
                }).filter(Boolean);

              if (selected.length === 0) {
                return <Text style={{ color: '#666' }}>No interests selected</Text>;
              }
              return selected.map((interest, i) => <Text key={i}>{interest}</Text>);
            })()}
          </View>
        </View>

        {/* Achievements Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>🏆 Achievements</Text>
          <View style={styles.achievementsList}>
            {achievements.map((a, i) => (
              <View key={i} style={[styles.achievementItem, a.unlocked ? styles.achievementUnlocked : styles.achievementLocked]}>
                <Text style={styles.achievementEmoji}>{a.unlocked ? '✅' : '🔒'}</Text>
                <Text style={[styles.achievementText, a.unlocked ? {} : {color: '#aaa'}]}>{a.title}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Edit Profile Button */}
        <TouchableOpacity style={[styles.editButton]} onPress={() => setEditModalVisible(true)}>
          <Text style={styles.editButtonText}>⚙️ Edit Profile</Text>
        </TouchableOpacity>

        {/* Change Password Button */}
        <TouchableOpacity 
          style={[styles.changePasswordButton]} 
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.changePasswordButtonText}>🔒 Change Password</Text>
        </TouchableOpacity>

        {/* Change Password Modal */}
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setModalVisible(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalContainer}
          >
            <View style={[styles.modalContent, { borderColor: currentHouseColor }]}>
              <Text style={[styles.modalTitle, { color: currentHouseColor }]}>Change Password</Text>

              <TextInput
                placeholder="Current Password"
                secureTextEntry
                style={styles.input}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                autoCapitalize="none"
              />

              <TextInput
                placeholder="New Password (min 6 chars)"
                secureTextEntry
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                autoCapitalize="none"
              />

              <TextInput
                placeholder="Confirm New Password"
                secureTextEntry
                style={styles.input}
                value={confirmNewPassword}
                onChangeText={setConfirmNewPassword}
                autoCapitalize="none"
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  onPress={() => setModalVisible(false)} 
                  style={[styles.modalButton, styles.cancelButton]}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={handleChangePassword} 
                  style={[styles.modalButton, styles.saveButton]}
                  disabled={loadingPassword}
                >
                  <Text style={styles.modalButtonText}>{loadingPassword ? 'Saving...' : 'Save'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* Edit Profile Modal */}
        <Modal
          visible={editModalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setEditModalVisible(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalContainer}
          >
            <View style={[styles.modalContent, { borderColor: currentHouseColor }]}>
              <Text style={[styles.modalTitle, { color: currentHouseColor }]}>Edit Profile</Text>

              <Text style={{ fontWeight: '600', marginBottom: 15, fontSize: 16 }}>What You Enjoy</Text>

              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setEditInterests(prev => ({ ...prev, boardGames: !prev.boardGames }))}
                activeOpacity={0.8}
              >
                <Checkbox
                  status={editInterests.boardGames ? 'checked' : 'unchecked'}
                  onPress={() => setEditInterests(prev => ({ ...prev, boardGames: !prev.boardGames }))}
                />
                <Text style={styles.checkboxLabel}>♟️ Board Games</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setEditInterests(prev => ({ ...prev, sports: !prev.sports }))}
                activeOpacity={0.8}
              >
                <Checkbox
                  status={editInterests.sports ? 'checked' : 'unchecked'}
                  onPress={() => setEditInterests(prev => ({ ...prev, sports: !prev.sports }))}
                />
                <Text style={styles.checkboxLabel}>⚽ Sports</Text>
              </TouchableOpacity>

              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  onPress={() => setEditModalVisible(false)} 
                  style={[styles.modalButton, styles.cancelButton]}
                  disabled={savingProfile}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={handleSaveProfile} 
                  style={[styles.modalButton, styles.saveButton]}
                  disabled={savingProfile}
                >
                  <Text style={styles.modalButtonText}>{savingProfile ? 'Saving...' : 'Save'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor removed to allow dynamic bg color
  },
  headerCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 30,
    paddingHorizontal: 20,
    marginBottom: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 7,
    position: 'relative',
    borderWidth: 3,
  },
  logoutButton: {
    position: 'absolute',
    top: 18,
    right: 18,
    backgroundColor: '#3498db',
    padding: 10,
    borderRadius: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
  },
  avatarWrapper: {
    borderWidth: 3,
    borderRadius: 75,
    padding: 4,
    marginBottom: 15,
    shadowColor: '#666',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 75,
  },
  name: {
    fontSize: 28,
    fontWeight: '800',
    color: '#222',
    marginBottom: 6,
  },
  houseBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 40,
  },
  houseText: {
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 1,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 15,
    color: '#444',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statLabel: {
    fontSize: 16,
    color: '#666',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
  },
  achievementsList: {
    marginTop: 5,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 30,
  },
  achievementUnlocked: {
    backgroundColor: '#d4edda',
  },
  achievementLocked: {
    backgroundColor: '#f0f0f0',
  },
  achievementEmoji: {
    fontSize: 22,
    marginRight: 12,
  },
  achievementText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  editButton: {
    backgroundColor: '#6C63FF',
    marginTop: 10,
    paddingVertical: 15,
    borderRadius: 40,
    alignItems: 'center',
    shadowColor: '#6C63FF',
    shadowOpacity: 0.7,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  editButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 18,
  },
  changePasswordButton: {
    backgroundColor: '#FF6B6B',
    marginTop: 15,
    paddingVertical: 15,
    borderRadius: 40,
    alignItems: 'center',
    shadowColor: '#FF6B6B',
    shadowOpacity: 0.7,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  changePasswordButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 18,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#00000066',
    paddingHorizontal: 25,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 30,
    paddingHorizontal: 25,
    borderWidth: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 15,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 15,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 35,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#bbb',
  },
  saveButton: {
    backgroundColor: '#6C63FF',
  },
  modalButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  checkboxLabel: {
    fontSize: 18,
    marginLeft: 10,
    userSelect: 'none',
  },
});
