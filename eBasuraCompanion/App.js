
import React, {Component} from 'react';
import {Platform, StyleSheet, Text, View} from 'react-native';

import AppNavigator from './navigation/AppNavigator.js'

export default class App extends Component {
  render() {
    return (
      <AppNavigator />
    );
  }
}
