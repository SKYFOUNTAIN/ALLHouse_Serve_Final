// AdminAttendanceScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { useRoute } from '@react-navigation/native';
import { FontAwesome } from '@expo/vector-icons';

export default function AdminAttendanceScreen() {
  const route = useRoute();
  const { eventId, eventTitle } = route.params;

  const [signUps, setSignUps] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [searchVisible, setSearchVisible] = useState(false);

  useEffect(() => {
    const fetchSignUps = async () => {
      try {
        const eventDoc = await getDoc(doc(db, 'events', eventId));
        if (eventDoc.exists()) {
          const data = eventDoc.data();
          setSignUps(data.signUps || {});
        } else {
          Alert.alert('Error', 'Event not found.');
        }
      } catch (error) {
        console.error('Error fetching event data:', error);
        Alert.alert('Error', 'Failed to load event data.');
      } finally {
        setLoading(false);
      }
    };

    fetchSignUps();
  }, [eventId]);

  // Set attendance explicitly: true = Present, false = Absent
  const setAttendance = async (userId, attendedStatus) => {
    try {
      const eventRef = doc(db, 'events', eventId);
      await updateDoc(eventRef, {
        [`signUps.${userId}.attended`]: attendedStatus,
      });

      setSignUps((prev) => ({
        ...prev,
        [userId]: {
          ...prev[userId],
          attended: attendedStatus,
        },
      }));
    } catch (error) {
      console.error('Error updating attendance:', error);
      Alert.alert('Error', 'Could not update attendance.');
    }
  };

  function getSecFromEmail(email) {
    const currentYear = new Date().getFullYear();
    const match = email.match(/@s(\d{4})\.ssts\.edu\.sg$/);
    if (!match) return 'Unknown Sec';
    const yearTurned13 = parseInt(match[1], 10);
    const birthYear = yearTurned13 - 13;
    const age = currentYear - birthYear;

    switch (age) {
      case 13:
        return 'Sec 1';
      case 14:
        return 'Sec 2';
      case 15:
        return 'Sec 3';
      case 16:
        return 'Sec 4';
      default:
        return 'Unknown Sec';
    }
  }

  let signUpsArray = Object.entries(signUps).map(([userId, data]) => ({
    userId,
    name: data.name,
    house: data.house || 'Unknown House',
    email: data.email,
    attended: data.attended, // can be true, false, or undefined
    sec: getSecFromEmail(data.email),
  }));

  if (searchText.trim() !== '') {
    const lowerSearch = searchText.toLowerCase();
    signUpsArray = signUpsArray.filter(
      (s) =>
        s.name.toLowerCase().includes(lowerSearch) ||
        s.email.toLowerCase().includes(lowerSearch)
    );
  }

  const groupedData = signUpsArray.reduce((acc, signUp) => {
    const house = signUp.house || 'Unknown House';
    const secGroup = signUp.sec || 'Unknown Sec';

    if (!acc[house]) acc[house] = {};
    if (!acc[house][secGroup]) acc[house][secGroup] = [];
    acc[house][secGroup].push(signUp);

    return acc;
  }, {});

  const renderSignUp = ({ item }) => {
    const { userId, name, house, email, attended } = item;

    // Determine background color based on attendance status
    // attended === true => green (Present)
    // attended === false => red (Absent)
    // undefined or null => white
    let bgColor = '#fff';
    if (attended === true) bgColor = '#2ecc71';
    else if (attended === false) bgColor = '#e74c3c';

    return (
      <View style={[styles.signUpRow, { backgroundColor: bgColor }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.details}>
            {house} House | {email}
          </Text>
        </View>

        {/* Present Button */}
        <TouchableOpacity
          style={[
            styles.presentButton,
            attended === true && styles.selectedPresent,
          ]}
          onPress={() => setAttendance(userId, true)}
        >
          <Text
            style={[
              styles.attendanceText,
              attended === true && styles.selectedText,
            ]}
          >
            Present
          </Text>
        </TouchableOpacity>

        {/* Absent Button */}
        <TouchableOpacity
          style={[
            styles.absentButton,
            attended === false && styles.selectedAbsent,
          ]}
          onPress={() => setAttendance(userId, false)}
        >
          <Text
            style={[
              styles.attendanceText,
              attended === false && styles.selectedText,
            ]}
          >
            Absent
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const houses = Object.keys(groupedData);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </SafeAreaView>
    );
  }

  const totalSignUpsCount = Object.keys(signUps).length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>Attendance for {eventTitle}</Text>

        <TouchableOpacity
          onPress={() => {
            if (searchVisible) setSearchText(''); // clear search when hiding
            setSearchVisible((v) => !v);
          }}
          style={{ marginLeft: 10 }}
          accessibilityLabel="Toggle search"
        >
          <FontAwesome name="search" size={22} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Display total signups */}
      <View style={styles.totalSignUpsContainer}>
        <Text style={styles.totalSignUpsText}>
          Total Signed Up: {totalSignUpsCount}
        </Text>
      </View>

      {searchVisible && (
        <TextInput
          style={styles.searchInput}
          placeholder="Search name or email"
          value={searchText}
          onChangeText={setSearchText}
          clearButtonMode="while-editing"
          autoFocus
        />
      )}

      {signUpsArray.length === 0 ? (
        <Text style={styles.noSignUps}>No matching sign-ups found.</Text>
      ) : (
        <FlatList
          data={houses}
          keyExtractor={(house) => house}
          renderItem={({ item: house }) => {
            const secs = Object.keys(groupedData[house]);
            return (
              <View style={{ marginBottom: 30 }}>
                <Text style={styles.houseTitle}>{house} House</Text>
                <FlatList
                  data={secs}
                  keyExtractor={(sec) => sec}
                  renderItem={({ item: sec }) => (
                    <View style={{ marginBottom: 12 }}>
                      <Text style={styles.secGroupTitle}>{sec}</Text>
                      <FlatList
                        data={groupedData[house][sec]}
                        keyExtractor={(item) => item.userId}
                        renderItem={renderSignUp}
                        scrollEnabled={false}
                      />
                    </View>
                  )}
                  scrollEnabled={false}
                />
              </View>
            );
          }}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, paddingTop: 60, backgroundColor: '#fff' },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  header: { flex: 1, fontSize: 22, fontWeight: '700' },
  totalSignUpsContainer: {
    marginBottom: 12,
    alignItems: 'center',
  },
  totalSignUpsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  searchInput: {
    height: 36,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    marginBottom: 12,
  },
  noSignUps: { textAlign: 'center', fontSize: 18, marginTop: 40, color: '#666' },
  houseTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingBottom: 6,
  },
  secGroupTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 8,
  },
  signUpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  name: { fontSize: 18, fontWeight: '600' },
  details: { fontSize: 14, color: '#555' },

  // Present button style
  presentButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#27ae60',
    backgroundColor: '#d4f5d9',
    marginRight: 10,
  },
  selectedPresent: {
    backgroundColor: '#27ae60',
  },

  // Absent button style
  absentButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#c0392b',
    backgroundColor: '#f9d6d5',
  },
  selectedAbsent: {
    backgroundColor: '#c0392b',
  },

  attendanceText: {
    fontWeight: '700',
    color: '#333',
  },
  selectedText: {
    color: '#fff',
  },
});
