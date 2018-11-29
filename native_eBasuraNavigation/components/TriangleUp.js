import React from 'react';
import {StyleSheet, View} from 'react-native';

var TriangleUp = (props)=>{

  return (
    <View style={[styles.triangle, this.props.style]} />
  )
}

const styles = StyleSheet.create({
  triangle: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 50,
    borderRightWidth: 50,
    borderBottomWidth: 100,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'red'
  }
})

export default TriangleUp;