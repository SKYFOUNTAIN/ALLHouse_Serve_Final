import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { FontAwesome } from '@expo/vector-icons';

import SettingsScreen from './Screens/SettingsScreen';
import HomeScreen from './Screens/HomeScreen';
import ProfileScreen from './Screens/ProfileScreen';
import AcknowledgementsScreen from './Screens/AcknowledgementsScreen';
import LoginScreen from './Screens/LoginScreen';
import RegisterScreen from './Screens/RegisterScreen';
import EventsScreen from './Screens/EventsScreen';
import ChatsScreen from './Screens/ChatsScreen';
import YourHouseScreen from './Screens/YourHouseScreen';
import AddEventScreen from './Screens/AddEventScreen';
import AdminEventListScreen from './Screens/AdminEventListScreen';
import AttendanceScreen from './Screens/AdminAttendanceScreen';

import YellowLogo from './assets/YellowLogo.png';
import BlackLogo from './assets/BlackLogo.png';
import BlueLogo from './assets/BlueLogo.png';
import GreenLogo from './assets/GreenLogo.png';
import RedLogo from './assets/RedLogo.png';


const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Home stack: includes Profile and Acknowledgements
function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Acknowledgements" component={AcknowledgementsScreen} />
    </Stack.Navigator>
  );
}

function EventsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="EventsMain" component={EventsScreen} />
      <Stack.Screen name="AddEventScreen" component={AddEventScreen} />
      <Stack.Screen name="AdminEventListScreen" component={AdminEventListScreen} />
      <Stack.Screen name="AdminAttendanceScreen" component={AttendanceScreen} />
    </Stack.Navigator>
  );
}

function YourHouseStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="YourHouseMain" component={YourHouseScreen} />
    </Stack.Navigator>
  );
}

function ChatsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ChatsMain" component={ChatsScreen} />
    </Stack.Navigator>
  );
}

function SettingsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SettingsMain" component={SettingsScreen} />
    </Stack.Navigator>
  );
}

function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Home':
              iconName = 'home';
              break;
            case 'Events':
              iconName = 'calendar';
              break;
            case 'YourHouse':
              iconName = 'users';
              break;
            case 'Chats':
              iconName = 'bullhorn';
              break;
            case 'Settings':
              iconName = 'cog';
              break;
          }

          return <FontAwesome name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#3498db',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Events" component={EventsStack} />
      <Tab.Screen name="YourHouse" component={YourHouseStack} />
      <Tab.Screen name="Chats" component={ChatsStack} />
      <Tab.Screen name="Settings" component={SettingsStack} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* Auth screens */}
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />

        {/* Main app with bottom tabs */}
        <Stack.Screen name="MainTabs" component={BottomTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}


