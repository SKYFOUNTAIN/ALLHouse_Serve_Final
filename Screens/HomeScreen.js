import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Alert, StyleSheet, SafeAreaView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth } from '../firebase/firebase';
import { db } from '../firebase/firebase';
import { doc, getDoc, updateDoc, arrayUnion, increment, collection, query, orderBy, getDocs, onSnapshot } from 'firebase/firestore';
import { BarChart, Grid, XAxis } from 'react-native-svg-charts';
import * as scale from 'd3-scale';

function Button({ children, variant = 'solid', style, ...props }) {
  const backgroundColor =
    variant === 'ghost' ? 'transparent' :
    variant === 'outline' ? '#fff' : '#6C63FF';

  const textColor =
    variant === 'ghost' || variant === 'outline' ? '#6C63FF' : '#fff';

  const borderColor = variant === 'outline' ? '#6C63FF' : 'transparent';

  return (
    <TouchableOpacity
      style={[{
        backgroundColor,
        padding: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor,
        alignItems: 'center',
        marginTop: 6,
      }, style]}
      {...props}
    >
      <Text style={{ color: textColor }}>{children}</Text>
    </TouchableOpacity>
  );
}

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const [userData, setUserData] = useState(null);
  const [houseLeaderboard, setHouseLeaderboard] = useState([]);
  const [topEvent, setTopEvent] = useState(null);
  const [adminAlertShown, setAdminAlertShown] = useState(false);
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (!user) {
        setUserData(null);
        return;
      }

      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserData(data);

          const eventQuery = query(collection(db, 'events'));
          const eventSnap = await getDocs(eventQuery);
          const allEvents = eventSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

          const now = new Date();
          const upcoming = allEvents
            .filter(ev => new Date(ev.date) >= now)
            .sort((a, b) => new Date(a.date) - new Date(b.date));

          const matchedEvents = (data.categories || []).length
            ? upcoming.filter(ev => data.categories.includes(ev.category))
            : upcoming;

          const selectedEvent = matchedEvents.length > 0 ? matchedEvents[0] : null;
          setTopEvent(selectedEvent);

          if (data.isAdmin && !adminAlertShown) {
            Alert.alert('Admin Notice', 'Admin account logged in.');
            setAdminAlertShown(true);
          }
        } else {
          setUserData(null);
        }
      } catch (e) {
        console.error('Error fetching user data or events:', e);
        setUserData(null);
      }
    };

    const fetchLeaderboard = async () => {
      try {
        const leaderboardQuery = query(collection(db, 'houses'), orderBy('points', 'desc'));
        const querySnapshot = await getDocs(leaderboardQuery);
        const leaderboardData = [];
        querySnapshot.forEach((doc) => {
          leaderboardData.push({ id: doc.id, ...doc.data() });
        });
        setHouseLeaderboard(leaderboardData);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      }
    };

    const unsubscribeAnnouncements = onSnapshot(
      query(collection(db, 'announcements'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        const anns = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAnnouncements(anns);
      }
    );

    fetchUserData();
    fetchLeaderboard();

    return () => unsubscribeAnnouncements();
  }, [adminAlertShown]);

  const currentHouse = userData?.house || null;

  const handleSignUpForEvent = async (eventId, eventTitle) => {
    Alert.alert('Confirm Sign Up', `Sign up for "${eventTitle}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          const currentUser = auth.currentUser;
          if (!currentUser) return Alert.alert('Not Logged In');
  
          const userRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userRef);
          if (!userSnap.exists()) return Alert.alert('No user data');
  
          const user = userSnap.data();
          const eventRef = doc(db, 'events', eventId);
  
          try {
            await updateDoc(eventRef, {
              [`signUps.${currentUser.uid}`]: {
                name: user.name || 'Unknown',
                house: user.house || '',
                email: user.email || '',
                signedUpAt: new Date().toISOString(),
                attended: false,
              },
              signUpCount: increment(1),
            });
  
            // ✅ Send to Google Sheets
            fetch('https://script.google.com/macros/s/AKfycbwFvi1qgPzwr7gcZDT2HJkqO1oUseum0wIUAH_dFqs8gxusi-9uGTAVN2JOI1viLHHhOg/exec', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                eventTitle: eventTitle,
                house: user.house || '',
                name: user.name || 'Unknown',
                email: user.email || '',
                age: user.age || '', // make sure this field exists in your Firestore user
                signedUpAt: new Date().toISOString(),
              }),
            })
            .then(res => res.json())
            .then(json => {
              if (json.result !== 'success') {
                console.warn('Google Sheets logging failed:', json);
              }
            })
            .catch(err => {
              console.error('Failed to send to Google Sheets:', err);
            });
  
            Alert.alert('Signed Up!', `You are signed up for "${eventTitle}"`);
          } catch (error) {
            console.error('Failed to sign up:', error);
            Alert.alert('Error', 'Could not sign up. Please try again later.');
          }
        },
      },
    ]);
  };

  const barData = houseLeaderboard.map(h => ({
    value: h.points,
    svg: { fill: getHouseColor(h.id) },
    key: h.id,
  }));

  const barLabels = houseLeaderboard.map(h => h.id);

  // 🔥 Limit to 3 newest pinned announcements
  const pinnedAnnouncements = announcements
    .filter(ann => ann.pinned)
    .slice(0, 3);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentHouse ? getHouseColor(currentHouse) : '#f7f7f7' }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 70, paddingTop: 60 }]}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>🏆 Top Event For You</Text>
            <Button variant="ghost" onPress={() => navigation.navigate('Events')} style={{ padding: 0 }}>
              See All
            </Button>
          </View>
          {topEvent ? (
            <>
              <Text style={styles.bodyText}>Upcoming: {topEvent.title}</Text>
              <Button onPress={() => handleSignUpForEvent(topEvent.title)} style={styles.cardButton}>
                Sign Up for {topEvent.title}
              </Button>
            </>
          ) : (
            <Text style={styles.bodyText}>No event matching your interests currently.</Text>
          )}
          <Text style={styles.note}>* -1 point if you don't attend after signing up.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>💬 Announcements</Text>
          {pinnedAnnouncements.length === 0 ? (
            <Text style={styles.bodyText}>No pinned announcements yet.</Text>
          ) : (
            pinnedAnnouncements.map(ann => (
              <Text key={ann.id} style={styles.bodyText}>• {ann.text}</Text>
            ))
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>🏅 House Leaderboard</Text>
          {houseLeaderboard.length === 0 ? (
            <Text>Loading leaderboard...</Text>
          ) : (
            <>
              {houseLeaderboard.map((house, index) => (
                <View key={house.id} style={styles.leaderboardRow}>
                  <Text style={[styles.houseText, { color: getHouseColor(house.id) }]}>{index + 1}. {house.id} House</Text>
                  <Text style={styles.pointsText}>{house.points} pts</Text>
                </View>
              ))}
              <BarChart
                style={{ height: 150, marginTop: 20 }}
                data={barData}
                yAccessor={({ item }) => item.value}
                svg={{ fill: 'grey' }}
                contentInset={{ top: 10, bottom: 10 }}
                spacingInner={0.3}
                spacingOuter={0.2}
                gridMin={0}
                scale={scale.scaleBand}
              >
                <Grid />
              </BarChart>
              <XAxis
                style={{ marginTop: 8 }}
                data={barData}
                scale={scale.scaleBand}
                formatLabel={(value, index) => barLabels[index]}
                svg={{ fontSize: 14, fill: '#333' }}
                spacingInner={0.3}
                spacingOuter={0.2}
              />
            </>
          )}
        </View>
      </ScrollView>
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
    default: return '#999999';
  }
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: { fontSize: 22, fontWeight: 'bold' },
  bodyText: { fontSize: 16, marginTop: 6, lineHeight: 22 },
  note: { fontSize: 12, color: '#666', marginTop: 8 },
  cardButton: { marginTop: 12, borderRadius: 12 },
  leaderboardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  houseText: { fontSize: 16, fontWeight: '700' },
  pointsText: { fontSize: 16 },
});
