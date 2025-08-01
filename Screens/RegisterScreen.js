// RegisterScreen.js
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
    <ScrollView style={regStyles.container} keyboardShouldPersistTaps="handled">
      <Text style={regStyles.title}>Join the House Today.</Text>

      <TextInput
        style={regStyles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="Email (School Email)"
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <View style={regStyles.passwordContainer}>
        <TextInput
          style={[regStyles.input, { flex: 1, marginBottom: 0 }]}
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          secureTextEntry={!showPassword}
          autoCapitalize="none"
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={regStyles.eyeIcon}>
          <MaterialIcons name={showPassword ? 'visibility' : 'visibility-off'} size={24} color="#666" />
        </TouchableOpacity>
      </View>

      {Platform.OS === 'ios' ? (
        <>
          <TouchableOpacity
            onPress={() => setShowPicker(true)}
            style={regStyles.pickerButton}
          >
            <Text style={house ? regStyles.pickerText : regStyles.placeholderText}>
              {house || 'Select your house...'}
            </Text>
          </TouchableOpacity>

          <Modal
            visible={showPicker}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setShowPicker(false)}
          >
            <View style={regStyles.modalOverlay}>
              <View style={regStyles.modalContent}>
                <View style={regStyles.pickerContainer}>
                  <Picker
                    selectedValue={house}
                    onValueChange={(value) => {
                      setHouse(value);
                      setShowPicker(false);
                    }}
                    style={regStyles.iosPicker}
                    itemStyle={regStyles.iosPickerItem}
                    mode="dropdown"
                  >
                    <Picker.Item label="Select your house..." value="" />
                    {houseOptions.map((h) => (
                      <Picker.Item key={h} label={h} value={h} />
                    ))}
                  </Picker>
                </View>

                <Pressable onPress={() => setShowPicker(false)} style={regStyles.doneButton}>
                  <Text style={regStyles.doneText}>Done</Text>
                </Pressable>
              </View>
            </View>
          </Modal>
        </>
      ) : (
        <View style={regStyles.pickerWrapper}>
          <Picker
            selectedValue={house}
            onValueChange={setHouse}
            style={regStyles.androidPicker}
            mode="dropdown"
          >
            <Picker.Item label="Select your house..." value="" />
            {houseOptions.map((h) => (
              <Picker.Item key={h} label={h} value={h} />
            ))}
          </Picker>
        </View>
      )}

      <Text style={{ marginTop: 10, fontWeight: '600' }}>What You Enjoy</Text>

      <View style={regStyles.checkboxRow}>
        <Checkbox
          status={interests.boardGames ? 'checked' : 'unchecked'}
          onPress={() =>
            setInterests({ ...interests, boardGames: !interests.boardGames })
          }
        />
        <Text style={regStyles.checkboxLabel}>♟️ Board Games</Text>
      </View>

      <View style={regStyles.checkboxRow}>
        <Checkbox
          status={interests.sports ? 'checked' : 'unchecked'}
          onPress={() =>
            setInterests({ ...interests, sports: !interests.sports })
          }
        />
        <Text style={regStyles.checkboxLabel}>⚽ Sports</Text>
      </View>

      <TouchableOpacity onPress={handleRegister} style={regStyles.button}>
        <Text style={regStyles.buttonText}>{loading ? 'Registering...' : 'Register'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.replace('Login')}>
        <Text style={regStyles.bottomText}>
          Already have an account? <Text style={regStyles.linkText}>Login</Text>
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const regStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 30,
    paddingTop: 80,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 40,
    color: '#000',
  },
  input: {
    backgroundColor: '#eee',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    fontSize: 16,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eee',
    borderRadius: 12,
    marginBottom: 20,
    paddingRight: 10,
  },
  eyeIcon: {
    padding: 10,
  },
  pickerWrapper: {
    backgroundColor: '#eee',
    borderRadius: 12,
    marginBottom: 20,
    height: 50,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  androidPicker: {
    flex: 1,
  },
  pickerButton: {
    backgroundColor: '#eee',
    borderRadius: 12,
    padding: 15,
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
    color: '#000',
    fontSize: 18,
  },
  doneButton: {
    padding: 10,
    alignItems: 'center',
  },
  doneText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#d25c60',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  checkboxLabel: {
    fontSize: 16,
  },
  button: {
    marginTop: 30,
    borderRadius: 8,
    backgroundColor: '#373434ff',
    paddingVertical: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 14,
    color: '#000',
  },
  linkText: {
    color: '#1815e1ff',
    fontWeight: 'bold',
  },
});
