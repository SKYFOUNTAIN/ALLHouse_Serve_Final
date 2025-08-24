import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { auth, db } from '../firebase/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { MaterialIcons } from '@expo/vector-icons';

export default function LoginScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing Information', 'Please enter both your email and password.');
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
      let message = 'Login failed. Wrong email or password.';
      if (error.code === 'auth/user-not-found') message = 'No account found. Please register.';
      else if (error.code === 'auth/wrong-password') message = 'Incorrect password. Try again.';
      else if (error.code === 'auth/invalid-email') message = 'Invalid email address.';
      Alert.alert('Login Error', message);
    }
    setLoading(false);
  };

  const handleForgotPassword = () => {
    if (!email) {
      Alert.alert('Enter Email', 'Please enter your email first.');
      return;
    }
    sendPasswordResetEmail(auth, email)
      .then(() => Alert.alert('Password Reset', `Email sent to ${email}.`))
      .catch((error) => {
        let message = 'Failed to send password reset email.';
        if (error.code === 'auth/user-not-found') message = 'No account found with this email.';
        else if (error.code === 'auth/invalid-email') message = 'Invalid email address.';
        Alert.alert('Error', message);
      });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.topSection}>
        <Text style={styles.header}>Welcome</Text>
        <Text style={styles.subHeader}>Login to continue to ALLHouse</Text>
      </View>

      <View style={styles.card}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <MaterialIcons
              name={showPassword ? 'visibility' : 'visibility-off'}
              size={24}
              color="#999"
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={handleForgotPassword}>
          <Text style={styles.forgot}>Forgot Password?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, loading && { opacity: 0.6 }]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? 'Logging in...' : 'Login'}</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.replace('Register')}>
            <Text style={styles.link}>Sign up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f7f7f7',
    justifyContent: 'center',
    padding: 20,
  },
  topSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 15,
    borderRadius: 20,
  },
  header: {
    fontSize: 28,
    fontWeight: '700',
    color: '#222',
    marginBottom: 5,
  },
  subHeader: {
    fontSize: 14,
    color: '#555',
  },
  card: {
    backgroundColor: '#fff',
    padding: 25,
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#aaa',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  input: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 15,
  },
  passwordContainer: {
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 10,
    paddingRight: 10,
  },
  forgot: {
    alignSelf: 'flex-end',
    fontSize: 13,
    color: '#777',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#2b2bff',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 25,
    shadowColor: '#2b2bff',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  footerText: {
    color: '#333',
    fontSize: 14,
  },
  link: {
    color: '#2b2bff',
    fontWeight: '600',
    fontSize: 14,
  },
});
