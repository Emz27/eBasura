import React from 'react';
import { Col, Row, Button, ButtonGroup, Form, FormGroup, FormFeedback, Label, Input, ListGroup, ListGroupItem } from 'reactstrap';

import { firestore } from 'firebase';
import 'firebase/firestore';

export default class TrucksCRUD extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      truckDocId: "",
      truckId: "", 
      batch: {},
      collectors: [],

      trucks:[],
      users:[],
      batches:[],
      removedUsers:[],
      addedUsers:[],
      isLoading: false
    }
  }
  emptyForm = {
    truckDocId: "",
    truckId: "", 
    collectors: [],
    batch: {},
    truckIdError: "",
  }
  componentDidMount = async ()=>{
    this.setState({
      isLoading: true
    },async ()=>{await this.loadData();});
  }
  loadData = async ()=>{
    var trucks = [];
    var users = [];
    var batches = [];

    var batchesResults = await firestore().collection( "Batches" ).get();

    batchesResults.docs.forEach((doc)=>{
      batches.push({
        batchDocId: doc.id,
        batchId: doc.data().batchId,
        pickupLocations: doc.data().pickupLocations
      });
    });

    var userResults = await firestore().collection("Users")
        .where("truck.truckId","==","")
        .get();
    
    userResults.docs.forEach((doc)=>{
      users.push({
        userDocId: doc.id,
        userId: doc.data().userId,
        password: doc.data().password,
        truck: doc.data().truck,
        type: "collector",
      });
    })

    var truckResults = await firestore().collection( "Trucks" ).get();

    truckResults.docs.forEach(async (doc)=>{
      trucks.push({
        truckDocId: doc.id,
        truckId: doc.data().truckId, 
        batch: doc.data().batch,
        collectors : doc.data().collectors
      });
    })
    console.dir(users);
    console.dir(trucks);
    console.dir(batches);
    this.setState({
      users: users,
      trucks: trucks,
      batches: batches,
      isLoading: false,
    });
  }
  onInputChange = (input)=>{
    this.setState({...input});
  }
  onEdit = (item)=>{
    console.dir(item);
    this.setState({
      truckDocId: item.truckDocId,
      truckId: item.truckId, 
      batch: (item.batch),
      collectors: (item.collectors.length > 0)?item.collectors:[],
      truckIdError: "",
      isLoading: true,
    },async ()=>{await this.loadData();})
  }
  onAddItem = (item, index)=>{
    var users = [...this.state.users];
    users.splice(index,1);
    this.setState({
      collectors : [...this.state.collectors, item],
      users: users
    },()=>{

    });
  }
  onRemoveItem = (item, index)=>{
    item.truckId = this.state.truckId;
    item.truckDocId = this.state.truckDocId;
    var collectors = [...this.state.collectors];
    collectors.splice(index,1);
    this.setState({
      collectors: collectors,
      users: [...this.state.users,item]
    },()=>{
    })
  }
  onDelete = async (item)=>{
    var batch = firestore().batch();

    this.state.collectors.forEach((user)=>{
      batch.update(
        firestore().collection("Users").doc(user.userDocId),
        {
          truck:{
            truckId: "",
            truckDocId: "",
          }
        }
      );
    })
    batch.delete(firestore().collection("Trucks").doc(item.truckDocId));
    await batch.commit();
    this.setState({
      truckDocId: "",
      truckId: "", 
      collectors: [],
      batch: {},
      truckIdError: "",
      isLoading: true
    },async ()=>{
      await this.loadData();
    });
  }
  validateForm = async ()=>{
    var error = {
      truckIdError:"",
    }
    if(this.state.truckId.length == 0 ) error.truckIdError = "Truck ID field is required";
    else if(this.state.truckDocId.length == 0){
      var result = await firestore().collection("Trucks").where( "truckId", "==", this.state.truckId ).get();
      if(result.docs.length > 0)  error.truckIdError = "truckId is not available";
    }
    
    this.setState({...error});
    if(error.truckIdError.length > 0 ) return false;
    else return true;
  }
  onSave = async (event)=>{
    
    this.setState({
      isLoading: true,
    }, async ()=>{
      if(await this.validateForm()){
        var truckDocId = "";
        var truck = {
          truckId: this.state.truckId, 
          collectors: this.state.collectors,
          batch: this.state.batch
        } 
        if(this.state.truckDocId){
          truckDocId = this.state.truckDocId;
          await firestore().collection("Trucks").doc(this.state.truckDocId).update(truck);
        }
        else {
          var truckRef = await firestore().collection("Trucks").add(truck);
          truckDocId = truckRef.id;
        }
        this.state.users.forEach((user)=>{
          firestore().collection("Users").doc(user.userDocId).update({
            truck:{
              truckId: "",
              truckDocId: ""
            }
          })
        })
        this.state.collectors.filter((user)=>user.truck.truckId.length==0).forEach((user)=>{
          firestore().collection("Users").doc(user.userDocId).update({
            truck:{
              truckId: this.state.truckId,
              truckDocId: truckDocId
            }
          })
        })
        console.dir(this.state.collectors);
        console.dir(this.state.users);
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
  
  render (){
    return (
      <div className="row m-5 p-5">
        <div className="col">
          <Form>
            <h4>Truck Details</h4>
            <FormGroup>
              <Label for="truckId">Truck ID</Label>
              <Input required type="text" name="truckId" id="truckId" placeholder="" 
                {...(this.state.truckIdError)?{invalid:true}:{}}
                value={this.state.truckId}
                onChange={(event)=>this.onInputChange({truckId: event.target.value})}/>
              <FormFeedback>{this.state.truckIdError}</FormFeedback>
            </FormGroup>
            <FormGroup>
              <Label for="batchId">Batch ID</Label>
              <Input type="select" name="select" id="batchId">
                {
                  this.state.batches.map((item)=>{
                    return(
                      <option key={item.batchDocId} value={item.batchDocId}>{item.batchId}</option>
                    )
                  })
                }
              </Input>
            </FormGroup>
            <FormGroup>
              <ListGroup flush>
                {
                  this.state.collectors.map((user, index)=>
                    <ListGroupItem key={user.userDocId}>
                      <Row>
                        
                        <div>{user.userId}</div>
                        <ButtonGroup size="sm" className="ml-auto">
                            <Button disabled={this.state.isLoading} onClick={()=>{this.onRemoveItem( user ,index )}}>Remove</Button>
                        </ButtonGroup>
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
        </div>
        <div className="col">
          <Row> 
            <Row>
              <ListGroup flush>
                {
                  this.state.trucks.map((truck)=>
                    <ListGroupItem key={truck.truckDocId}>
                      <Row>
                        <div>{truck.truckId}</div>
                        <ButtonGroup size="sm" className="ml-auto">
                          <Button
                            disabled={this.state.isLoading}
                            onClick={()=>{this.onEdit(truck)}}>Edit</Button>
                          <Button
                            disabled={this.state.isLoading}
                            onClick={()=>{this.onDelete(truck)}}>Delete</Button>
                        </ButtonGroup>
                      </Row>
                    </ListGroupItem>
                  )
                }
              </ListGroup>
            </Row>
          </Row>
          <Row>
              <ListGroup flush>
                {
                  this.state.users.map((user, index)=>
                    <ListGroupItem key={user.userDocId}>
                      <Row>
                        <ButtonGroup size="sm" className="mr-auto">
                            <Button disabled={this.state.isLoading} onClick={()=>{this.onAddItem( user ,index )}}>Add</Button>
                        </ButtonGroup>
                        <div>{user.userId}</div>
                      </Row>
                    </ListGroupItem>
                  )
                }
              </ListGroup>
          </Row>
          
        </div>
      </div>
    );
  }
}