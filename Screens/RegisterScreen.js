import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  Modal,
  Platform,
  Pressable,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import { Checkbox } from 'react-native-paper';
import { auth, db } from '../firebase/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { MaterialIcons } from '@expo/vector-icons';

const houseOptions = ['Red', 'Blue', 'Green', 'Yellow', 'Black'];

export default function RegisterScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [house, setHouse] = useState('');
  const [interests, setInterests] = useState({ boardGames: false, sports: false });
  const [loading, setLoading] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = async () => {
    if (!email || !password || !house) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const rawName = email.split('@')[0].replace(/_/g, ' ');
      const name = rawName
        .split(' ')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');

      await setDoc(doc(db, 'users', user.uid), {
        name: name,
        email: email,
        house: house,
        interests: interests,
        eventsAttended: 0,
        eventsWon: 0,
      });

      setLoading(false);
      Alert.alert('Success', 'Account created successfully.');
      navigation.replace('Login');
    } catch (error) {
      setLoading(false);
      Alert.alert('Registration Error', error.message);
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.card}>
        <Text style={styles.title}>Create Account</Text>

        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="Email (School Email)"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <MaterialIcons name={showPassword ? 'visibility' : 'visibility-off'} size={24} color="#999" />
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Select Your House</Text>
        {Platform.OS === 'ios' ? (
          <>
            <TouchableOpacity
              onPress={() => setShowPicker(true)}
              style={styles.pickerButton}
            >
              <Text style={house ? styles.pickerText : styles.placeholderText}>
                {house || 'Choose your house...'}
              </Text>
            </TouchableOpacity>

            <Modal
              visible={showPicker}
              animationType="slide"
              transparent={true}
              onRequestClose={() => setShowPicker(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={house}
                      onValueChange={(value) => {
                        setHouse(value);
                        setShowPicker(false);
                      }}
                      style={styles.iosPicker}
                      itemStyle={styles.iosPickerItem}
                      mode="dropdown"
                    >
                      <Picker.Item label="Choose your house..." value="" />
                      {houseOptions.map((h) => (
                        <Picker.Item key={h} label={h} value={h} />
                      ))}
                    </Picker>
                  </View>
                  <Pressable onPress={() => setShowPicker(false)} style={styles.doneButton}>
                    <Text style={styles.doneText}>Done</Text>
                  </Pressable>
                </View>
              </View>
            </Modal>
          </>
        ) : (
          <View style={styles.androidPickerContainer}>
            <Picker
              selectedValue={house}
              onValueChange={setHouse}
              style={styles.androidPicker}
              mode="dropdown"
            >
              <Picker.Item label="Choose your house..." value="" />
              {houseOptions.map((h) => (
                <Picker.Item key={h} label={h} value={h} />
              ))}
            </Picker>
          </View>
        )}

        <Text style={styles.label}>What You Enjoy</Text>
        <View style={styles.checkboxRow}>
          <Checkbox
            status={interests.boardGames ? 'checked' : 'unchecked'}
            onPress={() =>
              setInterests({ ...interests, boardGames: !interests.boardGames })
            }
          />
          <Text style={styles.checkboxLabel}>♟️ Board Games</Text>
        </View>
        <View style={styles.checkboxRow}>
          <Checkbox
            status={interests.sports ? 'checked' : 'unchecked'}
            onPress={() =>
              setInterests({ ...interests, sports: !interests.sports })
            }
          />
          <Text style={styles.checkboxLabel}>⚽ Sports</Text>
        </View>

        <TouchableOpacity onPress={handleRegister} style={styles.button}>
          <Text style={styles.buttonText}>{loading ? 'Registering...' : 'Register'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.replace('Login')}>
          <Text style={styles.footerText}>
            Already have an account? <Text style={styles.link}>Login</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f2',
    paddingTop: 53,
  },
  card: {
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    elevation: 3,
    shadowColor: '#aaa',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    marginBottom: 25,
  },
  input: {
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 15,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 10,
  },
  label: {
    fontWeight: '600',
    marginVertical: 8,
    fontSize: 15,
    color: '#444',
  },
  androidPickerContainer: {
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    marginBottom: 20,
    overflow: 'hidden',
  },
  androidPicker: {
    height: 50,
    width: '100%',
  },
  pickerButton: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  pickerText: {
    fontSize: 16,
    color: '#000',
  },
  placeholderText: {
    fontSize: 16,
    color: '#888',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    paddingBottom: 20,
  },
  pickerContainer: {
    backgroundColor: '#fff',
    height: 216,
    justifyContent: 'center',
    width: '100%',
  },
  iosPicker: {
    backgroundColor: '#fff',
    color: '#000',
    width: '100%',
    height: 216,
  },
  iosPickerItem: {
    fontSize: 18,
  },
  doneButton: {
    padding: 10,
    alignItems: 'center',
  },
  doneText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2b2bff',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  checkboxLabel: {
    fontSize: 16,
  },
  button: {
    backgroundColor: '#2b2bff',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  footerText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#333',
    fontSize: 14,
  },
  link: {
    color: '#2b2bff',
    fontWeight: '600',
  },
});