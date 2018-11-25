/** @format */
import React from 'react'
import {AppRegistry, Text, View} from 'react-native';
import App from './App.js';
import {name as appName} from './app.json';

// export default class App extends React.Component {

//   render(){
//     return (
//       <View><Text>asdsadsaddsadxxx</Text></View>
//     )
//   }
// }


AppRegistry.registerComponent(appName, () => App);



