import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Alert,
  Platform,
  TouchableOpacity,
  Switch,
  StyleSheet,
  ScrollView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { collection, addDoc, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';

// All houses available (adjust as needed)
const ALL_HOUSES = ['Red', 'Blue', 'Green', 'Yellow', 'Black'];

export default function AddEventScreen({ navigation }) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [category, setCategory] = useState('sports');
  const [description, setDescription] = useState('');
  const [isCompulsory, setIsCompulsory] = useState(false);
  const [selectedHouses, setSelectedHouses] = useState([]); // selected houses

  const formatDate = (dateObj) => {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const onChangeDate = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) setDate(selectedDate);
  };

  // Toggle house in selectedHouses
  const toggleHouse = (house) => {
    if (selectedHouses.includes(house)) {
      setSelectedHouses(selectedHouses.filter(h => h !== house));
    } else {
      setSelectedHouses([...selectedHouses, house]);
    }
  };

  // Select all or clear all houses
  const toggleSelectAll = () => {
    if (selectedHouses.length === ALL_HOUSES.length) {
      setSelectedHouses([]);
    } else {
      setSelectedHouses([...ALL_HOUSES]);
    }
  };

  const handleAddEvent = async () => {
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Please enter a title for the event.');
      return;
    }

    if (selectedHouses.length === 0) {
      Alert.alert('Validation Error', 'Please select at least one house or select all.');
      return;
    }

    try {
      const eventData = {
        title,
        date: formatDate(date),
        category,
        description,
        color: category === 'sports' ? 'blue' : 'yellow',
        compulsory: isCompulsory,
        signUps: {},
        signUpCount: 0,
        houses: selectedHouses, // save selected houses here
      };

      // Add event first
      const eventRef = await addDoc(collection(db, 'events'), eventData);

      // If compulsory, auto sign-up all users in selected houses only
      if (isCompulsory) {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        let updates = {};
        let count = 0;

        usersSnapshot.forEach(docSnap => {
          const user = docSnap.data();
          if (selectedHouses.includes(user.house)) { // only users from selected houses
            updates[`signUps.${docSnap.id}`] = {
              name: user.name || 'Unknown',
              house: user.house || '',
              email: user.email || '',
              signedUpAt: new Date().toISOString(),
              attended: false,
            };
            count++;
          }
        });

        // Update event document with all signups
        await updateDoc(eventRef, {
          ...updates,
          signUpCount: count,
        });
      }

      Alert.alert('Success', 'Event added!');
      // Reset form
      setTitle('');
      setDate(new Date());
      setCategory('sports');
      setDescription('');
      setIsCompulsory(false);
      setSelectedHouses([]);
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.heading}>➕ Add New Event</Text>

      <TextInput
        placeholder="Event Title"
        value={title}
        onChangeText={setTitle}
        style={styles.input}
      />

      <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.input}>
        <Text>Select Date: {formatDate(date)}</Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="calendar"
          onChange={onChangeDate}
          minimumDate={new Date()}
        />
      )}

      <Text style={styles.label}>Category</Text>
      <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={category}
          onValueChange={(itemValue) => setCategory(itemValue)}
        >
          <Picker.Item label="⚽ Sports" value="sports" />
          <Picker.Item label="♟ Board Games" value="boardGames" />
        </Picker>
      </View>

      <TextInput
        placeholder="Description (optional)"
        value={description}
        onChangeText={setDescription}
        style={[styles.input, { height: 80 }]}
        multiline
      />

      <View style={styles.switchContainer}>
        <Text style={styles.label}>Compulsory Event</Text>
        <Switch
          value={isCompulsory}
          onValueChange={setIsCompulsory}
          thumbColor={isCompulsory ? '#6C63FF' : '#ccc'}
          trackColor={{ false: '#999', true: '#6C63FF88' }}
        />
      </View>

      {/* House Selection */}
      <Text style={[styles.label, { marginTop: 10 }]}>Select Houses</Text>
      <View style={styles.housesContainer}>
        <TouchableOpacity onPress={toggleSelectAll} style={styles.selectAllButton}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>
            {selectedHouses.length === ALL_HOUSES.length ? 'Deselect All' : 'Select All'}
          </Text>
        </TouchableOpacity>
        {ALL_HOUSES.map((house) => {
          const isSelected = selectedHouses.includes(house);
          return (
            <TouchableOpacity
              key={house}
              onPress={() => toggleHouse(house)}
              style={[
                styles.houseButton,
                { backgroundColor: isSelected ? getHouseColor(house) : '#ddd' },
              ]}
            >
              <Text style={{ color: isSelected ? '#fff' : '#333', fontWeight: '600' }}>{house}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity style={styles.button} onPress={handleAddEvent}>
        <Text style={styles.buttonText}>Create Event</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.cancelButton]}
        onPress={() => navigation.goBack()}
      >
        <Text style={[styles.buttonText, { color: '#6C63FF' }]}>Cancel</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// House color helper (same as EventsScreen)
function getHouseColor(houseName) {
  switch (houseName) {
    case 'Red': return '#e74c3c';
    case 'Blue': return '#3498db';
    case 'Green': return '#2ecc71';
    case 'Yellow': return '#FFD700';
    case 'Black': return '#333333';
    default: return '#999';
  }
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f4f6f8',
    paddingTop: 60,
    flex: 1,
  },
  heading: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 24,
    textAlign: 'center',
    color: '#333',
  },
  label: {
    marginBottom: 6,
    fontWeight: '600',
    fontSize: 14,
    color: '#555',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 14,
    borderRadius: 14,
    marginBottom: 16,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 14,
    marginBottom: 16,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
  },
  housesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
    alignItems: 'center',
  },
  houseButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    marginTop: 8,
    elevation: 1,
  },
  selectAllButton: {
    backgroundColor: '#6C63FF',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
    marginBottom: 10,
    alignSelf: 'flex-start',
    elevation: 2,
  },
  button: {
    backgroundColor: '#6C63FF',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    elevation: 3,
    marginBottom: 16,
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#6C63FF',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  buttonText: {
    fontWeight: '700',
    fontSize: 16,
    color: '#fff',
  },
});

