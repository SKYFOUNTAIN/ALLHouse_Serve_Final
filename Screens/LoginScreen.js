import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, Alert, StyleSheet, SafeAreaView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { FontAwesome, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Checkbox } from 'react-native-paper';
import { Calendar } from 'react-native-calendars';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native';
import * as ExpoCalendar from 'expo-calendar';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { auth } from '../firebase/firebase';
import { db } from '../firebase/firebase';
import { doc, getDoc, updateDoc, arrayUnion, increment, setDoc } from 'firebase/firestore';
import { onAuthStateChanged, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator(); 

function Card({ children }) {
  return (
    <View style={{
      backgroundColor: '#fff',
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    }}>
      {children}
    </View>
  );
}

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

function Avatar({ uri }) {
  return (
    <View style={{ width: 40, height: 40, borderRadius: 20, overflow: 'hidden', marginRight: 12 }}>
      <Image source={{ uri }} style={{ width: 40, height: 40 }} />
    </View>
  );
}

export default function LoginScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing Information', 'Please enter both your email and password to continue.');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        await setDoc(docRef, {
          email: user.email,
          house: '',
          categories: [],
          eventsAttended: 0,
          xp: 0,
          wins: 0,
        });
      }

      navigation.replace('MainTabs');
    } catch (error) {
      // Friendly error messages depending on error code
      let message = 'Login failed. Wrong email or password.';
      if (error.code === 'auth/user-not-found') {
        message = 'No account found with this email. Please register first.';
      } else if (error.code === 'auth/wrong-password') {
        message = 'Incorrect email or password. Please try again.';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Invalid email format. Please check your email address. Eg. nice_user@s2024.ssts.edu.sg';
      }

      Alert.alert('Login Error', message);
    }
    setLoading(false);
  };

  const handleForgotPassword = () => {
  if (!email) {
    Alert.alert('Enter Email', 'Please enter your email address first to reset your password.');
    return;
  }

  sendPasswordResetEmail(auth, email)
    .then(() => {
      Alert.alert('Password Reset', `A password reset email has been sent to ${email}. Please check your inbox or spam.`);
    })
    .catch((error) => {
      console.error('Password reset error:', error); // <--- Add this to see exact errors
      let message = 'Failed to send password reset email.';
      if (error.code === 'auth/user-not-found') {
        message = 'No account found with this email.';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Invalid email address format.';
      }
      Alert.alert('Error', message);
    });
};

  return (
    <ScrollView contentContainerStyle={logStyles.container}>
      <Text style={logStyles.title}>The House You Need.</Text>

      <TextInput
        style={logStyles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={logStyles.input}
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        secureTextEntry
        autoCapitalize="none"
      />

      {/* Forgot Password Button */}
      <TouchableOpacity onPress={handleForgotPassword} style={logStyles.forgotPasswordButton}>
        <Text style={logStyles.forgotPasswordText}>Forgot Password?</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleLogin} style={logStyles.button} disabled={loading}>
        <Text style={logStyles.buttonText}>{loading ? 'Logging in...' : 'Login'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.replace('Register')}>
        <Text style={logStyles.bottomText}>
          Don't have an account? <Text style={logStyles.linkText}>Sign up</Text>
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const logStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
    backgroundColor: '#fff',
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
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: '#d25c60',
    fontWeight: '600',
    fontSize: 14,
  },
  button: {
    marginTop: 0,
    borderRadius: 8,
    backgroundColor: '#d25c60',
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
    color: '#d25c60',
    fontWeight: 'bold',
  },
});
