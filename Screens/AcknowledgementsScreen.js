import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { auth, db } from '../firebase/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { FontAwesome, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';

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

  const backgroundColor = houseColors[userData?.house] || '#F8F9FA';

  const teamMembers = [
    {
      name: 'Iresh Ramasamy',
      role: 'Lead Developer of ALLHouse (iOS/Android)',
      class: 'Class of 2027',
      icon: <MaterialIcons name="code" size={20} color="#D92D20" />,
    },
    {
      name: 'Evan Tan Jing Kai',
      role: "ALLHouse's Design and Communications IC",
      class: 'Class of 2027',
      icon: <FontAwesome name="apple" size={20} color="#D92D20" />,
    },
    {
      name: 'Christopher Richard Mills',
      role: "ALLHouse's Marketing and Design IC",
      class: 'Class of 2027',
      icon: <MaterialCommunityIcons name="palette" size={20} color="#D92D20" />,
    },
    {
      name: 'Thiha Linn Tun',
      role: "ALLHouse's Marketing and Design IC",
      class: 'Class of 2027',
      icon: <MaterialCommunityIcons name="bullhorn" size={20} color="#D92D20" />,
    },
  ];

  return (
    <SafeAreaView style={[ackStyles.container, { backgroundColor }]}>
      <ScrollView style={[ackStyles.scrollView, { paddingBottom: insets.bottom + 70, paddingTop: 120 }]} showsVerticalScrollIndicator={false}>
        <View style={ackStyles.card}>
          <View style={ackStyles.sectionHeader}>
            <MaterialCommunityIcons name="account-group" size={20} color="#D92D20" />
            <Text style={ackStyles.sectionTitle}>OUR TEAM</Text>
          </View>

          {teamMembers.map((member, index) => (
            <View key={index}>
              <View style={ackStyles.memberRow}>
                <View style={ackStyles.memberIcon}>{member.icon}</View>
                <View style={ackStyles.memberInfo}>
                  <Text style={ackStyles.memberName}>{member.name}</Text>
                  <Text style={ackStyles.memberRole}>{member.role}</Text>
                  <Text style={ackStyles.memberClass}>{member.class}</Text>
                </View>
              </View>
              {index !== teamMembers.length - 1 && <View style={ackStyles.divider} />}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const ackStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    marginLeft: 8,
    color: '#D92D20',
    fontWeight: '700',
    fontSize: 14,
    textTransform: 'uppercase',
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  memberIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FEE4E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontWeight: '700',
    fontSize: 15,
    color: '#101828',
  },
  memberRole: {
    fontSize: 14,
    color: '#667085',
    marginTop: 2,
  },
  memberClass: {
    fontSize: 13,
    color: '#98A2B3',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#EAECF0',
    marginVertical: 8,
  },
});
