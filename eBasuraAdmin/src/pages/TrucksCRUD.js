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
      collectorsDocId: [],
      collectorsId: [],
      batchId: "",
      batchDocId: "",
      batch: {},
      collectors: [],

      trucks:[],
      users:[],
      batches:[],
    }
  }
  componentDidMount = async ()=>{
    await this.loadData();
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
        pickupLocationsId: ( doc.data().pickupLocationsId.length > 0 )? doc.data().pickupLocationsId :[],
        pickupLocationsDocId: (doc.data().pickupLocationsDocId.length > 0 )?doc.data().pickupLocationsDocId.length: [],
      });
    });

    var userResults = await firestore().collection("Users")
        .where("type","==","collector")
        .where("truckId","==","")
        .get();
    
    userResults.docs.forEach((doc)=>{
      users.push({
        userDocId: doc.id,
        userId: doc.data().userId,
        password: doc.data().password,
        truckId: doc.data().truckId,
        truckDocId: doc.data().truckDocId,
        type: "collector",
      });
    })

    var truckResults = await firestore().collection( "Trucks" ).get();

    truckResults.docs.forEach(async (doc)=>{
      var batchResult = ""
      if(doc.data().batchDocId){
        batchResult = await firestore().collection("Batches").doc(doc.data().batchDocId).get();
      }
      var collectorsResults = await firestore().collection("Users").where("truckId","==",doc.data().truckId).get();
      var batch = (batchResult&&batchResult.exists)?({
        batchDocId: batchResult.id,
        batchId: batchResult.data().batchId,
        pickupLocationsId: batchResult.data().pickupLocationsId || [],
        pickupLocationsDocId: batchResult.data().pickupLocationsId || [],
      }):{};
      var collectors = [];

      collectorsResults.docs.forEach((item)=>{
        collectors.push({
          userDocId: item.id,
          userId: item.data().userId
        });
      });

      trucks.push({
        truckDocId: doc.id,
        truckId: doc.data().truckId, 
        collectorsDocId: (doc.data().collectorsDocId.length > 0)?doc.data().collectorsDocId : [] ,
        collectorsId:(doc.data().collectorsId.length > 0)?doc.data().collectorsId : [],
        batchId: doc.data().batchId,
        batchDocId: doc.data().batchDocId,
        batch: batch,
        collectors : collectors
      });
    })
    this.setState({
      users: users,
      trucks: trucks,
      batches: batches,
    });
  }
  onInputChange = (input)=>{
    this.setState({...input});
  }
  onEdit = (item)=>{
    this.setState({
      truckDocId: item.truckDocId,
      truckId: item.truckId, 
      collectorsDocId: item.collectorsDocId,
      collectorsId: item.collectorsId,
      batchId: item.batchId,
      batchDocId: item.batchDocId,
      truckIdError: "",
      batch: item.batch,
      collectors: item.collectors
    })
  }
  onAddItem = (item, index)=>{
    this.setState({
      collectorsDocId: [...this.state.collectorsDocId, item.userDocId],
      collectorsId: [...this.state.collectorsId, item.userId],
      users: this.state.users.splice(index,1)
    })
  }
  onRemoveItem = (item, index)=>{
    this.setState({
      collectorsDocId: this.state.users.splice(index,1),
      collectorsId: this.state.users.splice(index,1),
      users: [...this.state.users,item]
    })
  }
  onDelete = async (item)=>{
    await firestore().collection("Trucks").doc(item.truckDocId).delete();
    this.clearForm();
    this.loadData();
  }
  clearForm = ()=>{
    this.setState({
      truckDocId: "",
      truckId: "", 
      collectorsDocId: [],
      collectorsId: [],
      batchId: "",
      batchDocId: "",
      truckIdError: "",
    });
  }
  validateForm = async ()=>{
    var error = {
      truckIdError:"",
    }
    if(this.state.truckId.length == 0 ) error.truckIdError = "Truck ID field is required";
    else{
      var result = await firestore().collection("Trucks").where( "truckId", "==", this.state.truckId ).get();
      if(result.docs.length > 0)  error.truckIdError = "truckId is not available";
    }
    
    this.setState({...error});
    if(error.truckIdError.length > 0 ) return false;
    else return true;
  }
  onSave = async (event)=>{
    if(await this.validateForm()){
      var collectorsId = [];
      var collectorsDocId = [];

      this.state.collectors.forEach((item,index)=>{
        collectorsId.push(item.collectorsId);
        collectorsDocId.push(item.collectorsDocId);
      });
      if(this.state.truckDocId){
        await firestore().collection("Trucks").doc(this.state.truckDocId).update({
          truckId: this.state.truckId, 
          collectorsDocId: this.state.collectorsDocId,
          collectorsId: this.state.collectorsId,
          batchId: this.state.batchId,
          batchDocId: this.state.batchDocId,
        });
      }
      else {
        await firestore().collection("Trucks").doc().set({
          truckId: this.state.truckId, 
          collectorsDocId: this.state.collectorsDocId,
          collectorsId: this.state.collectorsId,
          batchId: this.state.batchId,
          batchDocId: this.state.batchDocId,
        });
      }
      this.clearForm();
      this.loadData();
      console.log("save successful");
    }
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
                            <Button onClick={()=>{this.onRemoveItem( user ,index )}}>Remove</Button>
                        </ButtonGroup>
                      </Row>
                    </ListGroupItem>
                  )
                }
              </ListGroup>
            </FormGroup>
            <hr />
            <Button
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
                            onClick={()=>{this.onEdit(truck)}}>Edit</Button>
                          <Button
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
                            <Button onClick={()=>{this.onAddItem( user ,index )}}>Add</Button>
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