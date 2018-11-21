import React, { Component } from 'react';
import { Row, Col, Button, ButtonGroup, Form, FormGroup, FormFeedback, Label, Input, ListGroup, ListGroupItem } from 'reactstrap';
import {Gmaps, Marker } from 'react-gmaps';

import { firestore } from 'firebase';
import 'firebase/firestore';

const GOOGLE_API_KEY = 'AIzaSyAKLNDKXRY5niSySOE8TIdz2yFgBmHyhjo';

const params = {v: '3.exp', key: GOOGLE_API_KEY};
export default class BatchesCRUD extends Component{
  constructor(){
    super();
    this.state = {
      batchDocId: "",
      batchId: "",
      pickupLocations: [],
      batches: [],

      originalPickupLocations: [],
      isLoading: false
    }
  }
  emptyForm = {
    batchDocId: "",
    batchId: "",
    pickupLocations: [],

    originalPickupLocations: [],
  }
  onMapCreated = (map)=>{
    map.setOptions({
      disableDefaultUI: true
    });
  }

  onDragEnd = (e)=>{
    console.log('onDragEnd', e);
  }

  onInfoCloseClick = ()=>{
    console.log('onCloseClick');
  }

  onMapClick= (e)=>{
    console.log('onClick', e, e.latLng, e.latLng.lat());
    //if(this.state.isLoading) return false;
    this.setState({
      isLoading: true
    }, async ()=>{
      var latitude = e.latLng.lat()
      var longitude = e.latLng.lng()
      var latlng = latitude +","+ longitude;
      var address = "";
      let response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latlng}&key=${GOOGLE_API_KEY}`);
      let responseJson = await response.json();
      if(responseJson.status === "OK"){
        address = responseJson.results[0].formatted_address;
      }
      var pass = this.state.pickupLocations.some((item)=>{
        return (
          item.address === address && item.address === address
        )
      })
      if(pass){
        console.log("duplicate pickup detected");
        return false
      }
      var pickupLocation = {
        pickupDocId: "",
        address: address,
        comment: "",
        location: {
          latitude: latitude,
          longitude: longitude,
        }
      }
      this.setState({
        pickupLocations:[...this.state.pickupLocations, pickupLocation],

        isLoading: false
      })
    });
    
  }
  componentDidMount = ()=>{
    this.setState({
      isLoading: true
    }, async ()=>{
      await this.loadData();
    })
  }
  onInputChange = (input)=>{
    this.setState({...input});
  }
  onEdit = async (batch, index )=>{
    this.setState({
      batchDocId: batch.batchDocId,
      batchId: batch.batchId,
      pickupLocations: batch.pickupLocations,

      originalPickupLocations: batch.pickupLocations,
    })
  }
  onDelete = (batch)=>{
    this.setState({
      isLoading: true,
    }, async ()=>{
      var batchProcess = firestore().batch();

      batch.pickupLocations.forEach((pickup, index)=>{
        batchProcess.delete(firestore().collection("PickupLocations").doc(pickup.pickupDocId));
      })
      batchProcess.delete(firestore().collection("PickupLocations").doc(batch.batchDocId));
      var truckRef = firestore().collection("Trucks").where("batch.batchId", "==", batch.batchId);
      batchProcess.update(truckRef,{
        batchDocId: "",
        batchId: "",
        pickupLocations: []
      });
      this.setState({
        ...this.emptyForm,
        isLoading: false
      })
    });
  }
  onRemove = async (pickup, index)=>{
    var pickupLocations = [...this.state.pickupLocations];
    pickupLocations.splice( index, 1 );
    this.setState({
      pickupLocations: pickupLocations
    })
  }
  validateForm = async ()=>{
    var error = {
      batchIdError:"",
    }
    if(this.state.batchId.length === 0 ) error.batchIdError = "batch ID field is required";
    else if(this.state.batchDocId.length === 0){
      var result = await firestore().collection("Batches").where( "batchId", "==", this.state.batchId ).get();
      if(result.docs.length > 0)  error.batchIdError = "Batch ID is not available";
    }
    
    this.setState({...error});
    if(error.batchIdError.length > 0 ) return false;
    else return true;
  }
  onSave = async ()=>{
    this.setState({
      isLoading: true,
    }, async ()=>{
      if(await this.validateForm()){
        var batchDocId = "";
        var pickupLocationsRef = firestore().collection("PickupLocations")
        var batchRef = "";
        
        var batchProcess = firestore().batch();
        if(this.state.batchDocId){
          batchDocId = this.state.batchDocId;
          batchRef = firestore().collection("Batches").doc(batchDocId);
        }
        else {
          batchRef = firestore().collection("Batches").doc();
          batchDocId = batchRef.id;
        }
        console.log("pickuplocation",this.state.pickupLocations );
        console.log("originalpickuplocation", this.state.originalPickupLocations);
        
        // delete removed pickups
        this.state.originalPickupLocations.forEach((originalPickup, index)=>{
          var find = this.state.pickupLocations.findIndex((pickup)=>{
            return pickup.pickupDocId === originalPickup.pickupDocId
          });
          if( find < 0 ){
            console.log("pickupremove", pickupLocationsRef.doc(originalPickup.pickupDocId))
            batchProcess.delete(pickupLocationsRef.doc(originalPickup.pickupDocId))
          }
        });

        // save added pickups
        this.state.pickupLocations.filter((pickup, index)=>{
          return pickup.pickupDocId === ""
        }).forEach((pickup)=>{
          console.log("add pickup");
          var ref = pickupLocationsRef.doc();
          pickup.pickupDocId = ref.id;
          batchProcess.set(ref,{
            ...pickup,
            batch:{
              batchDocId: batchDocId,
              batchId: this.state.batchId,
            },
          });
        })
        batchProcess.set(batchRef,{
          batchId: this.state.batchId, 
          pickupLocations: this.state.pickupLocations,
        })
        await batchProcess.commit();
        console.log("save successful");
        this.setState({
          ...this.emptyForm,
        }, async ()=>{
          await this.loadData();
        })
      }
      else {
        this.setState({

          isLoading: false,
        })
      }
    })
  }
  loadData = async ()=>{
    var batches = [];
    var batchResults = await firestore().collection("Batches").get();
    if(batchResults.docs.length > 0){
      batches = batchResults.docs.map(( doc )=>{
        var data = doc.data();
        console.log("pickuplocations", data.pickupLocations.length)
        return {
          batchDocId: doc.id,
          batchId: data.batchId,
          pickupLocations:(data.pickupLocations.length > 0)?data.pickupLocations:[],
          originalPickupLocations: (data.pickupLocations.length > 0)?data.pickupLocations:[],
        }
      });
    }
    this.setState({
      batches: batches,
      isLoading: false
    });
  }
  render() {
    return (
      <Row className="mt-5">
        <Col>
          <Gmaps
            width={'100%'}
            height={'600px'}
            lat={14.61881}
            lng={121.057171}
            zoom={12}
            loadingMessage={'Be happy'}
            params={params}
            onMapCreated={this.onMapCreated}
            onClick={this.onMapClick}>
            {
              this.state.pickupLocations.map((item, index)=>
                <Marker
                key={item.address}
                lat={item.location.latitude}
                lng={item.location.longitude}
                />
              )
            }
          </Gmaps>
        </Col>
        <Col>
          <Form>
            <FormGroup>
              <ListGroup flush>
                {
                  this.state.batches.map((item, index)=>
                    <ListGroupItem key={item.batchId}>
                      <Row>
                        <div>{item.batchId}</div>
                        <div>
                          <ButtonGroup size="sm" className="ml-auto">
                            <Button
                              disabled={this.state.isLoading}
                              onClick={()=>{this.onEdit(item)}}>Edit</Button>
                            <Button
                              disabled={this.state.isLoading}
                              onClick={()=>{this.onDelete(item)}}>Delete</Button>
                          </ButtonGroup>
                        </div>
                      </Row>
                    </ListGroupItem>
                  )
                }
              </ListGroup>
            </FormGroup>
            <FormGroup>
              <Label for="batchId">Batch ID</Label>
              <Input required type="text" name="batchId" id="batchId" placeholder="" 
                {...(this.state.batchIdError)?{invalid:true}:{}}
                value={this.state.batchId}
                onChange={(event)=>this.onInputChange({batchId: event.target.value})}/>
              <FormFeedback>{this.state.batchIdError}</FormFeedback>
            </FormGroup>
            <FormGroup>
              <ListGroup flush>
                {
                  this.state.pickupLocations.map((item, index)=>
                    <ListGroupItem key={item.address}>
                      <Row>
                        <ButtonGroup size="sm" className="ml-auto">
                          <Button
                            disabled={this.state.isLoading}
                            onClick={()=>{this.onRemove(item, index)}}>Remove</Button>
                        </ButtonGroup>
                      </Row>
                      <Row>
                        <div>{item.address}</div>
                      </Row>  
                    </ListGroupItem>
                  )
                }
              </ListGroup>
            </FormGroup>
            <hr />
            <Button disabled={this.state.isLoading}
              onClick={(event)=>this.onSave(event)}
             >Save</Button>
          </Form>
          
        </Col>
      </Row>
      
    );
  }
}