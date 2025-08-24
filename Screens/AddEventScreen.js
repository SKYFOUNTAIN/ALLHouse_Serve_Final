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
  Image
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { collection, addDoc, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { Video } from 'expo-av';

const ALL_HOUSES = ['Red', 'Blue', 'Green', 'Yellow', 'Black'];

export default function AddEventScreen({ navigation, route }) {
  const editingEvent = route.params?.eventToEdit || null;

  // State variables
  const [title, setTitle] = useState(editingEvent?.title || '');
  const [date, setDate] = useState(editingEvent ? new Date(editingEvent.date) : new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [category, setCategory] = useState(editingEvent?.category || 'sports');
  const [description, setDescription] = useState(editingEvent?.description || '');
  const [isCompulsory, setIsCompulsory] = useState(editingEvent?.compulsory || false);
  const [selectedHouses, setSelectedHouses] = useState(editingEvent?.houses || []);

  const [imageUri, setImageUri] = useState(editingEvent?.media?.image || null);
  const [videoUri, setVideoUri] = useState(editingEvent?.media?.video || null);
  const [externalLink, setExternalLink] = useState(editingEvent?.media?.link || '');

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

  const toggleHouse = (house) => {
    setSelectedHouses((prev) =>
      prev.includes(house) ? prev.filter((h) => h !== house) : [...prev, house]
    );
  };

  const toggleSelectAll = () => {
    setSelectedHouses((prev) =>
      prev.length === ALL_HOUSES.length ? [] : [...ALL_HOUSES]
    );
  };

  // Pick image from device
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Permission Denied', 'Cannot access media library.');
    let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  // Pick video from device
  const pickVideo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Permission Denied', 'Cannot access media library.');
    let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Videos });
    if (!result.canceled) setVideoUri(result.assets[0].uri);
  };

  // Remove selected image
  const removeImage = () => setImageUri(null);

  // Remove selected video
  const removeVideo = () => setVideoUri(null);

  const handleSaveEvent = async () => {
    if (!title.trim()) return Alert.alert('Validation Error', 'Please enter a title.');
    if (selectedHouses.length === 0) return Alert.alert('Validation Error', 'Select at least one house.');

    try {
      const eventData = {
        title,
        date: formatDate(date),
        category,
        description,
        color: category === 'sports' ? 'blue' : 'yellow',
        compulsory: isCompulsory,
        houses: selectedHouses,
        media: {
          image: imageUri || null,
          video: videoUri || null,
          link: externalLink || null,
        },
      };

      if (editingEvent) {
        // Update existing event
        await updateDoc(doc(db, 'events', editingEvent.id), eventData);
        Alert.alert('Success', 'Event updated!');
      } else {
        // Create new event
        const eventRef = await addDoc(collection(db, 'events'), { ...eventData, signUps: {}, signUpCount: 0 });

        if (isCompulsory) {
          const usersSnapshot = await getDocs(collection(db, 'users'));
          const updates = {};
          let count = 0;
          usersSnapshot.forEach((docSnap) => {
            const user = docSnap.data();
            if (selectedHouses.includes(user.house)) {
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
          await updateDoc(doc(db, 'events', eventRef.id), { ...updates, signUpCount: count });
        }

        Alert.alert('Success', 'Event added!');
      }

      navigation.goBack();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', err.message);
    }
  };

  const createDisabled = !title.trim() || selectedHouses.length === 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.heading}>{editingEvent ? 'Edit Event' : 'Add New Event'}</Text>

      <TextInput placeholder="Event Title" value={title} onChangeText={setTitle} style={styles.input} />

      <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.input}>
        <Text>Select Date: {formatDate(date)}</Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker value={date} mode="date" display="calendar" onChange={onChangeDate} minimumDate={new Date()} />
      )}

      <Text style={styles.label}>Category</Text>
      <View style={styles.pickerWrapper}>
        <Picker selectedValue={category} onValueChange={setCategory}>
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

      <TextInput
        placeholder="External Link (optional)"
        value={externalLink}
        onChangeText={setExternalLink}
        style={styles.input}
        autoCapitalize="none"
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

      <Text style={styles.label}>Media Upload</Text>
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
        <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
          <Text style={styles.uploadButtonText}>Pick Image</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.uploadButton} onPress={pickVideo}>
          <Text style={styles.uploadButtonText}>Pick Video</Text>
        </TouchableOpacity>
      </View>

      {imageUri && (
        <View style={{ marginBottom: 12 }}>
          <Image source={{ uri: imageUri }} style={{ width: '100%', height: 200, borderRadius: 12 }} />
          <TouchableOpacity onPress={removeImage} style={[styles.uploadButton, { marginTop: 8 }]}>
            <Text style={styles.uploadButtonText}>Remove Image</Text>
          </TouchableOpacity>
        </View>
      )}

      {videoUri && (
        <View style={{ marginBottom: 12 }}>
          <Video source={{ uri: videoUri }} style={{ width: '100%', height: 200, borderRadius: 12 }} useNativeControls resizeMode="contain" />
          <TouchableOpacity onPress={removeVideo} style={[styles.uploadButton, { marginTop: 8 }]}>
            <Text style={styles.uploadButtonText}>Remove Video</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.label}>Select Houses</Text>
      <View style={styles.housesContainer}>
        <TouchableOpacity onPress={toggleSelectAll} style={styles.selectAllButton}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>
            {selectedHouses.length === ALL_HOUSES.length ? 'Deselect All' : 'Select All'}
          </Text>
        </TouchableOpacity>
        {ALL_HOUSES.map((house) => (
          <TouchableOpacity
            key={house}
            onPress={() => toggleHouse(house)}
            style={[
              styles.houseButton,
              { backgroundColor: selectedHouses.includes(house) ? getHouseColor(house) : '#ddd' },
            ]}
          >
            <Text style={{ color: selectedHouses.includes(house) ? '#fff' : '#333', fontWeight: '600' }}>{house}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.button, createDisabled && styles.buttonDisabled]}
        onPress={handleSaveEvent}
        disabled={createDisabled}
        activeOpacity={createDisabled ? 1 : 0.7}
      >
        <Text style={styles.buttonText}>{editingEvent ? 'Save Changes' : 'Create Event'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => navigation.goBack()}>
        <Text style={[styles.buttonText, { color: '#6C63FF' }]}>Cancel</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

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
  container: { padding: 19, paddingBottom: 150, backgroundColor: '#f4f6f8', paddingTop: 60, flex: 1 },
  heading: { fontSize: 26, fontWeight: '800', marginBottom: 24, textAlign: 'center', color: '#333' },
  label: { marginBottom: 6, fontWeight: '600', fontSize: 14, color: '#555' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 14, borderRadius: 14, marginBottom: 16, backgroundColor: '#fff', fontSize: 16 },
  pickerWrapper: { borderWidth: 1, borderColor: '#ccc', borderRadius: 14, marginBottom: 16, backgroundColor: '#fff', overflow: 'hidden' },
  switchContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 },
  housesContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24, alignItems: 'center' },
  houseButton: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, marginRight: 8, marginTop: 8, elevation: 1 },
  selectAllButton: { backgroundColor: '#6C63FF', paddingVertical: 10, paddingHorizontal: 18, borderRadius: 20, marginBottom: 10, alignSelf: 'flex-start', elevation: 2 },
  button: { backgroundColor: '#6C63FF', paddingVertical: 16, borderRadius: 14, alignItems: 'center', elevation: 3, marginBottom: 16 },
  buttonDisabled: { opacity: 0.5 },
  cancelButton: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#6C63FF', paddingVertical: 12, borderRadius: 14, alignItems: 'center' },
  buttonText: { fontWeight: '700', fontSize: 16, color: '#fff' },
  uploadButton: { backgroundColor: '#6C63FF', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 14, alignItems: 'center' },
  uploadButtonText: { color: '#fff', fontWeight: '700' },
});
