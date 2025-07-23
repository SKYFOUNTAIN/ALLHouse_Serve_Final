import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Alert, SafeAreaView, StyleSheet
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth, db } from '../firebase/firebase';
import {
  doc, getDoc, updateDoc, increment, collection, onSnapshot, query, orderBy, deleteDoc
} from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';

function Card({ children }) {
  return (
    <View style={styles.card}>
      {children}
    </View>
  );
}

export default function EventsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userHouse, setUserHouse] = useState(null);
  const [showListView, setShowListView] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'events'), orderBy('date', 'asc'));
    const unsubscribe = onSnapshot(q, snapshot => {
      const evs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEvents(evs);
    }, (error) => {
      console.error('Error loading events:', error);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setIsAdmin(false);
      setUserHouse(null);
      return;
    }

    getDoc(doc(db, 'users', user.uid)).then(docSnap => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setIsAdmin(data.isAdmin === true);
        setUserHouse(data.house || null);
      } else {
        setIsAdmin(false);
        setUserHouse(null);
      }
    }).catch(err => {
      console.error('Failed to check admin:', err);
      setIsAdmin(false);
      setUserHouse(null);
    });
  }, []);

  const filteredEvents = events.filter(ev => {
    if (!ev.houses || ev.houses.length === 0) return true;
    if (!userHouse) return false;
    return ev.houses.includes(userHouse);
  });

  const handleDayPress = (day) => {
    const foundEvent = filteredEvents.find(ev => ev.date === day.dateString);
    if (foundEvent) {
      setSelectedEventId(foundEvent.id);
      setSelectedDate(day.dateString);
    } else {
      setSelectedEventId(null);
      setSelectedDate(day.dateString);
    }
  };

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

            fetch('https://script.google.com/macros/s/AKfycbwFvi1qgPzwr7gcZDT2HJkqO1oUseum0wIUAH_dFqs8gxusi-9uGTAVN2JOI1viLHHhOg/exec', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                eventTitle,
                house: user.house || '',
                name: user.name || 'Unknown',
                email: user.email || '',
                age: user.age || '',
                signedUpAt: new Date().toISOString(),
              }),
            }).catch(err => console.error('Failed to send to Google Sheets:', err));

            Alert.alert('Signed Up!', `You are signed up for "${eventTitle}"`);
          } catch (error) {
            console.error('Failed to sign up:', error);
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
            setSelectedEventId(null);
            Alert.alert('Deleted', `"${title}" has been deleted.`);
          } catch (error) {
            console.error('Delete failed:', error);
            Alert.alert('Error', 'Could not delete event. Try again.');
          }
        },
      },
    ]);
  };

  const markedDates = filteredEvents.reduce((acc, event) => {
    acc[event.date] = {
      marked: true,
      dotColor: event.color || 'blue',
      selected: selectedDate === event.date,
    };
    return acc;
  }, {});

  const selectedEvent = selectedEventId ? filteredEvents.find(ev => ev.id === selectedEventId) : null;

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top, backgroundColor: userHouse ? getHouseColor(userHouse) : '#f7f7f7' }]}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <View style={styles.headerRow}>
          <Text style={styles.header}>📅 Upcoming Events</Text>
          <TouchableOpacity onPress={() => setShowListView(!showListView)} style={styles.toggleButton}>
            <Text style={styles.toggleButtonText}>{showListView ? '🗓' : '☰'}</Text>
          </TouchableOpacity>
        </View>

        {showListView ? (
          filteredEvents.length === 0 ? (
            <Card><Text>No events available</Text></Card>
          ) : (
            filteredEvents.map(event => (
              <Card key={event.id}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <Text style={styles.eventInfo}><Text style={{ fontWeight: '600' }}>Date:</Text> {event.date}</Text>
                <Text style={styles.eventInfo}><Text style={{ fontWeight: '600' }}>Category:</Text> {event.category === 'boardGames' ? '♟️ Board Games' : '⚽ Sports'}</Text>
                {event.description && <Text style={{ marginBottom: 12 }}>{event.description}</Text>}
                <TouchableOpacity style={styles.signUpButton} onPress={() => signUpForEvent(event.id, event.title)}>
                  <Text style={styles.signUpButtonText}>Sign Up</Text>
                </TouchableOpacity>
                {isAdmin && (
                  <TouchableOpacity style={[styles.signUpButton, { backgroundColor: '#e74c3c', marginTop: 10 }]} onPress={() => deleteEvent(event.id, event.title)}>
                    <Text style={styles.signUpButtonText}>🗑 Delete Event</Text>
                  </TouchableOpacity>
                )}
              </Card>
            ))
          )
        ) : (
          <>
            <Card>
              <Calendar
                onDayPress={handleDayPress}
                markedDates={markedDates}
                theme={{
                  selectedDayBackgroundColor: '#6C63FF',
                  todayTextColor: '#6C63FF',
                }}
              />
            </Card>

            {selectedEvent ? (
              <Card>
                <Text style={styles.eventTitle}>{selectedEvent.title}</Text>
                <Text style={styles.eventInfo}><Text style={{ fontWeight: '600' }}>Date:</Text> {selectedEvent.date}</Text>
                <Text style={styles.eventInfo}>
                  <Text style={{ fontWeight: '600' }}>Category:</Text> {selectedEvent.category === 'boardGames' ? '♟️ Board Games' : '⚽ Sports'}
                </Text>
                {selectedEvent.description && <Text style={{ marginBottom: 12 }}>{selectedEvent.description}</Text>}

                <TouchableOpacity style={styles.signUpButton} onPress={() => signUpForEvent(selectedEvent.id, selectedEvent.title)}>
                  <Text style={styles.signUpButtonText}>Sign Up</Text>
                </TouchableOpacity>

                {isAdmin && (
                  <TouchableOpacity style={[styles.signUpButton, { backgroundColor: '#e74c3c', marginTop: 10 }]} onPress={() => deleteEvent(selectedEvent.id, selectedEvent.title)}>
                    <Text style={styles.signUpButtonText}>🗑 Delete Event</Text>
                  </TouchableOpacity>
                )}
              </Card>
            ) : selectedDate ? (
              <Card><Text>No event on {selectedDate}</Text></Card>
            ) : null}
          </>
        )}
      </ScrollView>

      {isAdmin && (
        <>
          <TouchableOpacity
            style={styles.floatingButton}
            onPress={() => navigation.navigate('AddEventScreen')}
            activeOpacity={0.7}
          >
            <Text style={styles.floatingButtonText}>＋</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.floatingButton, { right: 100, backgroundColor: '#2ecc71' }]}
            onPress={() => navigation.navigate('AdminEventListScreen')}
            activeOpacity={0.7}
          >
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
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  header: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    paddingLeft: 8,
  },
  toggleButton: {
    backgroundColor: '#fff',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  toggleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  eventTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  eventInfo: {
    marginBottom: 4,
  },
  signUpButton: {
    backgroundColor: '#6C63FF',
    padding: 10,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  signUpButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: '#6C63FF',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
  },
  floatingButtonText: {
    color: '#fff',
    fontSize: 36,
    lineHeight: 36,
    textAlign: 'center',
    marginBottom: 2,
  },
});
