import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, SafeAreaView, ActivityIndicator, StatusBar, TouchableOpacity, TextInput } from 'react-native';
import * as Location from 'expo-location';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function ClimaApp() {
  const [temperature, setTemperature] = useState<number | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [condition, setCondition] = useState<string>('weather-cloudy');
  const [loading, setLoading] = useState<boolean>(true);
  const [searchCity, setSearchCity] = useState('');

  // Map Open-Meteo WMO Weather codes to MaterialCommunityIcons
  const getWeatherIcon = (code: number) => {
    if (code === 0) return 'weather-sunny';
    if (code === 1 || code === 2) return 'weather-partly-cloudy';
    if (code === 3) return 'weather-cloudy';
    if (code === 45 || code === 48) return 'weather-fog';
    if (code >= 51 && code <= 55) return 'weather-rainy';
    if (code >= 61 && code <= 65) return 'weather-pouring';
    if (code >= 71 && code <= 77) return 'weather-snowy';
    if (code >= 95 && code <= 99) return 'weather-lightning';
    return 'weather-cloudy';
  };

  const fetchWeatherByCoords = async (latitude: number, longitude: number, cityName: string) => {
    setLoading(true);
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.current_weather) {
        setTemperature(Math.round(data.current_weather.temperature));
        setCondition(getWeatherIcon(data.current_weather.weathercode));
        setCity(cityName);
      } else {
        alert('Could not fetch weather data.');
      }
    } catch (error) {
      alert('Error fetching weather data.');
    }
    setLoading(false);
  };

  const getLocationWeather = async () => {
    setLoading(true);
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      alert('Permission to access location was denied');
      setLoading(false);
      return;
    }

    try {
      let location = await Location.getCurrentPositionAsync({});
      
      // Try to reverse geocode to get city name
      let reverseGeo = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });
      
      let currentCity = reverseGeo[0]?.city || reverseGeo[0]?.region || "Current Location";
      
      await fetchWeatherByCoords(location.coords.latitude, location.coords.longitude, currentCity);
    } catch (error) {
      alert('Could not get location.');
      setLoading(false);
    }
  };

  const getCityWeather = async () => {
    if (searchCity.trim() === '') return;
    setLoading(true);
    try {
      // Step 1: Geocode city name to coords
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchCity)}&count=1&language=en&format=json`;
      const geoResponse = await fetch(geoUrl);
      const geoData = await geoResponse.json();

      if (geoData.results && geoData.results.length > 0) {
        const { latitude, longitude, name } = geoData.results[0];
        // Step 2: Fetch weather for coords
        await fetchWeatherByCoords(latitude, longitude, name);
      } else {
        alert('City not found!');
        setLoading(false);
      }
    } catch (error) {
      alert('Error searching for city.');
      setLoading(false);
    }
  };

  useEffect(() => {
    getLocationWeather();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={{ color: 'white', marginTop: 10 }}>Fetching Weather...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2C3E50" />
      
      <View style={styles.searchSection}>
        <TextInput 
          style={styles.input}
          placeholder="Enter city name..."
          placeholderTextColor="#ccc"
          value={searchCity}
          onChangeText={setSearchCity}
          onSubmitEditing={getCityWeather}
        />
        <TouchableOpacity onPress={getCityWeather}>
          <MaterialCommunityIcons name="magnify" size={40} color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={getLocationWeather} style={{ marginLeft: 10 }}>
          <MaterialCommunityIcons name="crosshairs-gps" size={35} color="white" />
        </TouchableOpacity>
      </View>

      <View style={styles.weatherSection}>
        <MaterialCommunityIcons name={condition as any} size={150} color="white" />
        <View style={styles.tempContainer}>
          <Text style={styles.temperature}>{temperature !== null ? temperature : '--'}</Text>
          <Text style={styles.degree}>°C</Text>
        </View>
        <Text style={styles.cityText}>{city !== null ? city : 'Unknown City'}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2C3E50', // Nice dark blue/gray
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#2C3E50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  input: {
    flex: 1,
    height: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    paddingHorizontal: 20,
    color: 'white',
    fontSize: 18,
    marginRight: 10,
  },
  weatherSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tempContainer: {
    flexDirection: 'row',
    marginTop: 20,
  },
  temperature: {
    fontSize: 100,
    fontWeight: 'bold',
    color: 'white',
  },
  degree: {
    fontSize: 60,
    color: 'white',
    marginTop: 10,
  },
  cityText: {
    fontSize: 40,
    color: 'white',
    marginTop: 20,
    textAlign: 'center',
  }
});
