import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { auth, db } from '../firebase/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { FontAwesome, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const houseColors = {
  Red: '#e74c3c',
  Blue: '#3498db',
  Green: '#2ecc71',
  Yellow: '#f1c40f',
  Black: '#2c3e50',
};

export default function AcknowledgementsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserData(docSnap.data());
        }
      } catch (error) {
        console.error('Failed to load user data:', error);
      }
    });

    return () => unsubscribe();
  }, []);

  const backgroundColor = houseColors[userData?.house] || '#F2F4F7';

  const teamMembers = [
    {
      name: 'Iresh Ramasamy',
      role: 'Lead Developer of ALLHouse (iOS/Android)',
      class: 'Class of 2027',
      icon: <MaterialIcons name="code" size={28} color="#fff" />,
      color: '#FF6B6B',
    },
    {
      name: 'Evan Tan Jing Kai',
      role: "ALLHouse's Design and Communications IC",
      class: 'Class of 2027',
      icon: <FontAwesome name="apple" size={28} color="#fff" />,
      color: '#4D9DE0',
    },
    {
      name: 'Christopher Richard Mills',
      role: "ALLHouse's Marketing and Design IC",
      class: 'Class of 2027',
      icon: <MaterialCommunityIcons name="palette" size={28} color="#fff" />,
      color: '#F7B32B',
    },
    {
      name: 'Thiha Linn Tun',
      role: "ALLHouse's Marketing and Design IC",
      class: 'Class of 2027',
      icon: <MaterialCommunityIcons name="bullhorn" size={28} color="#fff" />,
      color: '#6A2C70',
    },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor }}>
      <LinearGradient
        colors={['#FF6B6B', '#FFD93D']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.banner}
      >
        <Text style={styles.bannerText}>Acknowledgements</Text>
        <Text style={styles.bannerSubtitle}>Meet the ALLHouse Team</Text>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {teamMembers.map((member, index) => (
          <LinearGradient
            key={index}
            colors={['#fff', 'rgba(255,255,255,0.9)']}
            style={styles.card}
          >
            <View style={[styles.avatar, { backgroundColor: member.color }]}>
              {member.icon}
            </View>
            <View style={styles.textContent}>
              <Text style={styles.name}>{member.name}</Text>
              <Text style={styles.role}>{member.role}</Text>
              <Text style={styles.classText}>{member.class}</Text>
            </View>
          </LinearGradient>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  banner: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
    borderBottomRightRadius: 40,
    borderBottomLeftRadius: 40,
    alignItems: 'center',
  },
  bannerText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 6,
  },
  bannerSubtitle: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  scroll: {
    paddingTop: 25,
    paddingHorizontal: 20,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 25,
    padding: 20,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 6,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 18,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 4,
  },
  textContent: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1D2939',
  },
  role: {
    fontSize: 14,
    color: '#475467',
    marginTop: 2,
  },
  classText: {
    fontSize: 12,
    color: '#98A2B3',
    marginTop: 2,
  },
});
