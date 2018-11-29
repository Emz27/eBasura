
import React from 'react';
import { Platform, StatusBar, StyleSheet, View , Text, Alert} from 'react-native';
//import { AppLoading, Asset, Font, Icon } from 'expo';
import firebase from 'react-native-firebase';


import {Navigator} from './navigation/Navigator.js'
import { withNavigation } from 'react-navigation';

firebase.firestore().settings({
  persistence: true
})


export default class App extends React.Component {
  render() {
      return (
        <View style={styles.container}>
          {Platform.OS === 'ios' && <StatusBar barStyle="default" />}
          <Navigator />
        </View>
      );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
