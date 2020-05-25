/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import MapView from 'react-native-maps';
import BackgroundGeolocation from 'react-native-mauron85-background-geolocation';

const { width, height } = Dimensions.get('window');

const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;
let id = 0;

function degreesToRadians(degrees) {
  return degrees * Math.PI / 180;
}

function distanceInKmBetweenEarthCoordinates(lat1, lon1, lat2, lon2) {
  var earthRadiusKm = 6371;

  var dLat = degreesToRadians(lat2-lat1);
  var dLon = degreesToRadians(lon2-lon1);

  lat1 = degreesToRadians(lat1);
  lat2 = degreesToRadians(lat2);

  var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2); 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return earthRadiusKm * c;
}

export default class runtracker extends Component {
  constructor(props) {
    super(props);
    
    this.state = {
      polylines: [],
      currentPolyline: [],
      currentDistance: 0,
      editing: null,
      tracking: false,
      region: {
        latitude: 37.78825,
        longitude: -122.4324,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      }
    }

    console.log('Constructor ', this.state);

    this.setupBackgroundLocation();
  }

  setupBackgroundLocation() {
    BackgroundGeolocation.configure({
      desiredAccuracy: 10,
      stationaryRadius: 50,
      distanceFilter: 50,
      locationTimeout: 30,
      notificationTitle: 'Background tracking',
      notificationText: 'enabled',
      debug: false,
      startOnBoot: false,
      stopOnTerminate: true,
      interval: 10000,
      fastestInterval: 5000,
      activitiesInterval: 10000,
      stopOnStillActivity: false,
    });

    BackgroundGeolocation.on('location', (location) => {
      const { currentPolyline, region } = this.state;
      let distance = 0;
      if (currentPolyline.length > 0) {
        const lastLocation = currentPolyline[currentPolyline.length - 1];
        distance = distanceInKmBetweenEarthCoordinates(
          location.latitude, location.longitude,
          lastLocation.latitude, lastLocation.longitude
        );
      }
      this.setState({
        currentPolyline: [...currentPolyline, location],
        currentDistance: this.state.currentDistance + distance,
        region: {
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: region.latitudeDelta,
          longitudeDelta: region.longitudeDelta,
        }
      });
    });

    BackgroundGeolocation.on('stationary', (stationaryLocation) => {
      //handle stationary locations here
    });

    BackgroundGeolocation.on('error', (error) => {
      console.log('[ERROR] BackgroundGeolocation error:', error);
    });

    BackgroundGeolocation.start(() => {
      console.log('[DEBUG] BackgroundGeolocation started successfully');    
    });    
  }

  onPanDrag(e) {
  }

  onRegionChange(region) {
    this.setState({ region });
  }

  startStop() {
    if (this.state.tracking) {
      this.state.tracking = false;
      const { polylines, distances } = this.state;
      this.setState({
        polylines: [...polylines, this.state.currentPolyline],
        currentPolyline: [],
        tracking: false,
      });
      BackgroundGeolocation.stop();
      id += 1;
    } else {
      this.setState({
        tracking: true,
      });
      BackgroundGeolocation.start();
    }
  }

  center() {
    navigator.geolocation.getCurrentPosition((pos) => {
      this.setState({
        region: {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
        }
      });
    });    
  }

  printableDistance() {
    const kms = Number(this.state.currentDistance).toFixed(2);
    return '' + kms + ' km';
  }

  render() {
    const fontColor = this.state.tracking ? '#F01A1A' : 'black';
    return (
      <View style={styles.container}>
        <MapView
          provider={this.props.provider}
          style={styles.map}
          scrollEnabled={true}
          region={this.state.region}
          onRegionChange={(region) => this.onRegionChange(region)}
        >
          {this.state.polylines.map((polyline, index) => (
            <MapView.Polyline
              key={index}
              coordinates={polyline}
              strokeColor="#000"
              fillColor="rgba(255,0,0,0.5)"
              strokeWidth={5}
            />
          ))}
          <MapView.Polyline
            key="currentPolyline"
            coordinates={this.state.currentPolyline}
            strokeColor="#F01A1A"
            fillColor="rgba(255,0,0,0.5)"
            strokeWidth={5}
          />
        </MapView>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            onPress={() => this.startStop()}
            style={[styles.bubble, styles.button]}
          >
            <Text>{this.state.tracking ? 'Stop' : 'Start'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => this.center()}
            style={[styles.bubble, styles.button]}
          >
            <Text>Center</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.textContainer}>
          <Text style={{
            textAlign: 'center',
            fontWeight: 'bold',
            fontSize: 36,
            textShadowOffset: {
              width: 2,
              height: 2,
            },
            textShadowColor: 'white',
            color: fontColor,
          }}>{this.printableDistance()}</Text>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  bubble: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 20,
  },
  latlng: {
    width: 200,
    alignItems: 'stretch',
  },
  button: {
    width: 80,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginHorizontal: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginVertical: 10,
    backgroundColor: 'transparent',
  },
  textContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: 'transparent',
  },

});

AppRegistry.registerComponent('runtracker', () => runtracker);
