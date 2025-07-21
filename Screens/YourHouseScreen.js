import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth, db } from '../firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';

import YellowLogo from '../assets/YellowLogo.png';
import BlackLogo from '../assets/BlackLogo.png';
import BlueLogo from '../assets/BlueLogo.png';
import GreenLogo from '../assets/GreenLogo.png';
import RedLogo from '../assets/RedLogo.png';

function Card({ children, style }) {
  return (
    <View style={[styles.card, style]}>
      {children}
    </View>
  );
}

const houseLogos = {
  Yellow: YellowLogo,
  Black: BlackLogo,
  Blue: BlueLogo,
  Green: GreenLogo,
  Red: RedLogo,
};

const formatRank = (rank) => {
  if (!rank || rank === 'N/A') return 'N/A';
  const j = rank % 10,
        k = rank % 100;
  if (j === 1 && k !== 11) return rank + "st";
  if (j === 2 && k !== 12) return rank + "nd";
  if (j === 3 && k !== 13) return rank + "rd";
  return rank + "th";
};

// Quote arrays and helper function
const getHouseQuote = (rank) => {
  const winningQuotes = [
    "Greatness is earned, not given.",
    "Victory belongs to the most persevering.",
    "Success is a series of small wins.",
    "You were born to win, but to be a winner, you must plan to win.",
    "Winners focus on winning. Losers focus on winners.",
    "The harder you work, the luckier you get.",
    "Winning isn't everything, but wanting to win is.",
    "Push yourself because no one else is going to do it for you.",
    "Excellence is not an act but a habit.",
    "Champions keep playing until they get it right.",
    "You did it — now do it again.",
    "Success comes from effort and resilience.",
    "Dream big, work hard, win smart.",
    "Winning is a habit. Unfortunately, so is losing.",
    "Stay humble. Stay hungry. Stay winning.",
    "House spirit leads to house glory.",
    "Today you shine. Tomorrow, you inspire.",
    "It always seems impossible until it's done.",
    "Let success make the noise.",
    "First place is earned, not inherited.",
    "You are proof that hard work pays off.",
    "Celebrate the victory, then train for the next.",
    "Leave no doubt — win with pride.",
    "Talent wins games. Teamwork wins cups.",
    "This house was built to lead.",
    "Exceed expectations every single time.",
    "Let your performance speak volumes.",
    "You carry the house legacy forward.",
    "This is your moment. Own it.",
    "Your spark lit the path to victory.",
    "Respect the past, dominate the present.",
    "You’re not lucky — you’re just prepared.",
    "Hard work + unity = house success.",
    "Rise. Roar. Rule.",
    "Your passion powered this win.",
    "Never settle for second place.",
    "Victory is just the beginning.",
    "Winning feels good — leading feels better.",
    "Your house sets the standard.",
    "Earn it. Own it. Repeat."
  ];

  const motivationalQuotes = [
    "Don't watch the clock; do what it does. Keep going.",
    "Every setback is a setup for a comeback.",
    "Champions are made from challenges.",
    "Progress is progress, no matter how small.",
    "Failure is not falling down but refusing to get up.",
    "Great efforts bring great rewards.",
    "It's not about how you start. It's how you finish.",
    "The best view comes after the hardest climb.",
    "Be proud of how far you've come.",
    "Success is built on struggle.",
    "Fall seven times, stand up eight.",
    "Small steps every day add up to big wins.",
    "Defeat is simply the addition of time to effort.",
    "Use loss as fuel, not fear.",
    "You haven’t lost — you’ve learned.",
    "Strong minds overcome weak outcomes.",
    "Persistence breaks resistance.",
    "Growth lives on the edge of comfort.",
    "Your house is more than a score.",
    "You’re not behind — you’re building.",
    "Even storms run out of rain.",
    "The journey continues. Stay steady.",
    "Champions rise after falling.",
    "There’s power in the comeback.",
    "You are stronger than yesterday.",
    "Turn struggle into strength.",
    "This isn’t the end — it’s a reset.",
    "Effort never goes unnoticed.",
    "Belief is the first step to victory.",
    "The climb is what makes the view great.",
    "Don’t count the days. Make the days count.",
    "House pride isn’t just points. It’s people.",
    "You’re not finished — you’re just warming up.",
    "Low rank ≠ low potential.",
    "Hard work beats luck when luck doesn’t work.",
    "Losing isn’t failing. Quitting is.",
    "Your story isn't over yet.",
    "Beneath every defeat is the seed of triumph.",
    "Determination builds champions.",
    "Make the next one your best one."
  ];

  if (rank === 'N/A') return "Stay focused. Your house journey is just beginning.";
  const numericRank = parseInt(rank);
  const day = new Date().getDate();
  if (numericRank >= 1 && numericRank <= 3) {
    return winningQuotes[day % winningQuotes.length];
  } else {
    return motivationalQuotes[day % motivationalQuotes.length];
  }
};

export default function YourHouseScreen() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [houseInfo, setHouseInfo] = useState(null);
  const [userData, setUserData] = useState(null);
  const [showAchievement, setShowAchievement] = useState(false);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    async function fetchData() {
      try {
        const user = auth.currentUser;
        if (!user) {
          setLoading(false);
          return;
        }
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (!userDoc.exists()) {
          setLoading(false);
          return;
        }
        const userData = userDoc.data();
        setUserData(userData);

        if (userData.house) {
          const houseDoc = await getDoc(doc(db, 'houses', userData.house));
          if (houseDoc.exists()) {
            const houseData = houseDoc.data();
            setHouseInfo(houseData);
            // Show achievement modal only if rank is 1, 2 or 3
            if (houseData.rank && [1, 2, 3].includes(Number(houseData.rank))) {
              setShowAchievement(true);
              Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
              }).start();
            }
          } else {
            setHouseInfo(null);
          }
        }
      } catch (err) {
        console.error('Error fetching YourHouseScreen data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [fadeAnim]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: '#ddd' }]}>
        <ActivityIndicator size="large" color="#666" style={{ marginTop: 100 }} />
      </SafeAreaView>
    );
  }

  const currentHouse = houseInfo || {
    color: '#999999',
    motto: 'House info not available',
    committee: {
      "Teacher-in-Charge": {},
      captain: {},
      vicecaptain: {},
      vicecaptain2: {},
    },
    rank: 'N/A',
    points: '0',
  };

  const rank = currentHouse.rank ?? 'N/A';
  const points = currentHouse.points ?? '0';

  // Render the achievement popout overlay
  const AchievementModal = () => (
    <TouchableWithoutFeedback onPress={() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setShowAchievement(false));
    }}>
      <Animated.View style={[styles.achievementOverlay, { opacity: fadeAnim }]}>
        <View style={[styles.achievementBox, { borderColor: currentHouse.color }]}>
          {userData?.house && houseLogos[userData.house] && (
            <Image source={houseLogos[userData.house]} style={styles.achievementLogo} resizeMode="contain" />
          )}
          <Text style={styles.achievementTitle}>Congratulations!</Text>
          <Text style={styles.achievementText}>
            Your house is ranked <Text style={styles.achievementRank}>{formatRank(rank)}</Text>!
          </Text>
          <Text style={styles.achievementTap}>Tap anywhere to continue</Text>
        </View>
      </Animated.View>
    </TouchableWithoutFeedback>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentHouse.color || '#eee' }]}>
      {showAchievement && <AchievementModal />}
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 80 }]}>
        
        {/* Header Section */}
        <View style={styles.header}>
          {userData?.house && houseLogos[userData.house] && (
            <Image source={houseLogos[userData.house]} style={styles.houseLogo} resizeMode="contain" />
          )}
          <Text style={styles.houseName}>
            {userData?.house || 'House'} House
          </Text>
          <View style={styles.rankContainer}>
            <Text style={styles.rankText}>{formatRank(rank)}</Text>
          </View>
          <Text style={styles.mottoText}>“{currentHouse.motto || '—'}”</Text>
        </View>

        {/* Points Card with big centered text */}
        <Card style={{ alignItems: 'center' }}>
          <Text style={styles.pointsTitle}>Points</Text>
          <Text style={styles.pointsValue}>{points}</Text>
        </Card>

        {/* Quote Card */}
        <Card>
          <Text style={styles.cardTitle}>💬 House Quote</Text>
          <Text style={styles.quoteText}>“{getHouseQuote(rank)}”</Text>
        </Card>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingHorizontal: 20,
    paddingTop: 80,
    gap: 30,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  houseLogo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#fff',
    marginBottom: 10,
  },
  houseName: {
    fontSize: 34,
    fontWeight: '900',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  rankContainer: {
    position: 'absolute',
    top: 0,
    right: 12,
    backgroundColor: '#fff9',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  rankText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#222',
  },
  mottoText: {
    marginTop: 12,
    fontSize: 20,
    fontStyle: 'italic',
    color: '#fff',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#fff',
    padding: 22,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 6,
  },
  pointsTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#333',
    marginBottom: 8,
  },
  pointsValue: {
    fontSize: 72,
    fontWeight: '900',
    color: '#222',
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 14,
    color: '#222',
  },
  quoteText: {
    fontSize: 18,
    fontStyle: 'italic',
    color: '#555',
    lineHeight: 26,
    textAlign: 'center',
  },
  achievementOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  achievementBox: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    marginHorizontal: 30,
    borderWidth: 4,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 15,
  },
  achievementLogo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  achievementTitle: {
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 8,
    color: '#222',
  },
  achievementText: {
    fontSize: 20,
    marginBottom: 14,
    color: '#444',
    textAlign: 'center',
  },
  achievementRank: {
    fontWeight: '900',
    color: '#000',
  },
  achievementQuote: {
    fontSize: 18,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 20,
  },
  achievementTap: {
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
  },
});
