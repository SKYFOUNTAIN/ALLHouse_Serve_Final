import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, SafeAreaView, StyleSheet, Image, Linking, Alert
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth, db } from '../firebase/firebase';
import {
  doc, getDoc, updateDoc, increment, collection, onSnapshot, query, orderBy, deleteDoc
} from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { Video } from 'expo-av';

function Card({ children }) {
  return <View style={styles.card}>{children}</View>;
}

export default function EventsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [expandedEventId, setExpandedEventId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userHouse, setUserHouse] = useState(null);
  const [showListView, setShowListView] = useState(false);
  const [visibleDetails, setVisibleDetails] = useState({});

  useEffect(() => {
    const q = query(collection(db, 'events'), orderBy('date', 'asc'));
    const unsubscribe = onSnapshot(q, snapshot => {
      const evs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEvents(evs);
    }, error => console.error(error));
    return unsubscribe;
  }, []);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    getDoc(doc(db, 'users', user.uid))
      .then(docSnap => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setIsAdmin(data.isAdmin === true);
          setUserHouse(data.house || null);
        }
      }).catch(err => console.error(err));
  }, []);

  const filteredEvents = events.filter(ev => {
    if (!ev.houses || ev.houses.length === 0) return true;
    if (!userHouse) return false;
    return ev.houses.includes(userHouse);
  });

  const toggleExpandEvent = (id) => setExpandedEventId(prev => prev === id ? null : id);
  const handleDayPress = (day) => { setSelectedDate(day.dateString); setExpandedEventId(null); };

  const signUpForEvent = async (eventId, eventTitle) => {
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
            Alert.alert('Signed Up!', `You are signed up for "${eventTitle}"`);
          } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Could not sign up. Please try again later.');
          }
        },
      },
    ]);
  };

  const deleteEvent = async (eventId, title) => {
    Alert.alert('Delete Event', `Are you sure you want to delete "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDoc(doc(db, 'events', eventId));
            if (expandedEventId === eventId) setExpandedEventId(null);
            Alert.alert('Deleted', `"${title}" has been deleted.`);
          } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Could not delete event. Try again.');
          }
        },
      },
    ]);
  };

  const markedDates = filteredEvents.reduce((acc, event) => {
    acc[event.date] = { marked: true, dotColor: event.color || 'blue', selected: selectedDate === event.date };
    return acc;
  }, {});

  const eventsToShow = selectedDate
    ? filteredEvents.filter(ev => ev.date === selectedDate)
    : [];

  const renderDetails = (event) => {
    const isVisible = visibleDetails[event.id];
    if (!isVisible) {
      return (
        <TouchableOpacity
          style={styles.showMediaButton}
          onPress={() => setVisibleDetails(prev => ({ ...prev, [event.id]: true }))}
        >
          <Text style={styles.showMediaButtonText}>Details</Text>
        </TouchableOpacity>
      );
    }
    return (
      <View style={{ marginBottom: 12 }}>
        {event.description ? <Text style={{ marginBottom: 12 }}>{event.description}</Text> : null}
        {event.media?.image ? (
          <Image
            source={{ uri: event.media.image }}
            style={{ width: '100%', height: 200, borderRadius: 12, marginBottom: 12 }}
            resizeMode="cover"
          />
        ) : null}
        {event.media?.video ? (
          <Video
            source={{ uri: event.media.video }}
            style={{ width: '100%', height: 220, borderRadius: 12, marginBottom: 12 }}
            useNativeControls
            resizeMode="contain"
            shouldPlay={false}
            isLooping={false}
          />
        ) : null}
        {event.media?.link ? (
          <TouchableOpacity onPress={() => Linking.openURL(event.media.link)}>
            <Text style={{ color: '#3498db', marginBottom: 12 }}>🔗 Open Event Link</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  };

  const renderEventCard = (event) => {
    const isExpanded = expandedEventId === event.id;
    return (
      <Card key={event.id}>
        <TouchableOpacity onPress={() => toggleExpandEvent(event.id)} style={styles.eventHeaderRow}>
          <Text style={styles.eventTitleSmall}>{event.title}</Text>
          <Text style={styles.eventDate}>{event.date}</Text>
        </TouchableOpacity>
        {isExpanded && (
          <View style={{ marginTop: 8 }}>
            {renderDetails(event)}
            <Text style={styles.eventInfo}>
              <Text style={{ fontWeight: '600' }}>Category:</Text> {event.category === 'boardGames' ? '♟️ Board Games' : '⚽ Sports'}
            </Text>
            <TouchableOpacity style={styles.signUpButton} onPress={() => signUpForEvent(event.id, event.title)}>
              <Text style={styles.signUpButtonText}>Sign Up</Text>
            </TouchableOpacity>
            {isAdmin && (
              <TouchableOpacity
                style={[styles.signUpButton, { backgroundColor: '#e74c3c', marginTop: 10 }]}
                onPress={() => deleteEvent(event.id, event.title)}
              >
                <Text style={styles.signUpButtonText}>Delete Event</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </Card>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top, backgroundColor: userHouse ? getHouseColor(userHouse) : '#f7f7f7' }]}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <View style={styles.headerRow}>
          <Text style={styles.header}>📅 Upcoming Events</Text>
          <TouchableOpacity onPress={() => setShowListView(!showListView)} style={styles.toggleButton}>
            <Text style={styles.toggleButtonText}>{showListView ? '🗓' : '☰'}</Text>
          </TouchableOpacity>
        </View>

        {showListView
          ? filteredEvents.length === 0 ? <Card><Text>No events available</Text></Card> : filteredEvents.map(renderEventCard)
          : <>
            <Card>
              <Calendar
                onDayPress={handleDayPress}
                markedDates={markedDates}
                theme={{ selectedDayBackgroundColor: '#6C63FF', todayTextColor: '#6C63FF' }}
              />
            </Card>
            {selectedDate && eventsToShow.length === 0 && <Card><Text>No events on {selectedDate}</Text></Card>}
            {eventsToShow.map(renderEventCard)}
          </>
        }
      </ScrollView>

      {isAdmin && (
        <>
          <TouchableOpacity style={styles.floatingButton} onPress={() => navigation.navigate('AddEventScreen')} activeOpacity={0.7}>
            <Text style={styles.floatingButtonText}>＋</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.floatingButton, { right: 100, backgroundColor: '#2ecc71' }]} onPress={() => navigation.navigate('AdminEventListScreen')} activeOpacity={0.7}>
            <Text style={styles.floatingButtonText}>👁</Text>
          </TouchableOpacity>
        </>
      )}
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
    default: return '#f7f7f7';
  }
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingHorizontal: 8 },
  header: { fontSize: 26, fontWeight: 'bold', color: '#fff', paddingLeft: 8 },
  toggleButton: { backgroundColor: '#fff', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ccc' },
  toggleButtonText: { fontSize: 16, fontWeight: '600', color: '#333' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  eventHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eventTitleSmall: { fontSize: 18, fontWeight: '600' },
  eventDate: { fontSize: 16, color: '#555' },
  eventInfo: { marginBottom: 4 },
  signUpButton: { backgroundColor: '#6C63FF', padding: 10, borderRadius: 12, alignItems: 'center', marginTop: 6 },
  signUpButtonText: { color: '#fff', fontWeight: '600' },
  floatingButton: { position: 'absolute', bottom: 30, right: 20, backgroundColor: '#6C63FF', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 5 },
  floatingButtonText: { color: '#fff', fontSize: 36, lineHeight: 36, textAlign: 'center', marginBottom: 2 },
  showMediaButton: { backgroundColor: '#3498db', padding: 10, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
  showMediaButtonText: { color: '#fff', fontWeight: '600' },
});
