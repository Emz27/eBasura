
import 'bootstrap/dist/css/bootstrap.min.css';
// import 'your-path-to-fontawesome/js/all.js';
import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
import { initializeApp, firestore } from 'firebase';

initializeApp({
  apiKey: 'AIzaSyCHOMBr5-qyYELVws4Exa6hO8V-utuBl58',
  projectId: 'bamboo-rhino-221107'
});

// Initialize Cloud Firestore through Firebase
var db = firestore();

// Disable deprecated features
db.settings({
  timestampsInSnapshots: true
});

ReactDOM.render(<App />, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
