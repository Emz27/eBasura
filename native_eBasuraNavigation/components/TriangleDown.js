import React from 'react';
import {StyleSheet} from 'react-native';
import Triangle from './TriangleUp.js'

var TriangleDown = (props)=>{
    return (
      <Triangle style={styles.triangleDown}/>
    )
}


const styles = StyleSheet.create({
  triangleDown: {
    transform: [
      {rotate: '180deg'}
    ]
  }
})

export default TriangleDown;