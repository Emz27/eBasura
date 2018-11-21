import React from 'react';
import { Col, Row, Button, ButtonGroup, Form, FormGroup, FormFeedback, Label, Input, ListGroup, ListGroupItem } from 'reactstrap';

import { firestore } from 'firebase';
import 'firebase/firestore';

export default class UsersCRUD extends React.Component {
  constructor(){
    super();
    this.state = {
      userDocId:"",
      userName: "",
      password: "",
      confirmPassword: "",
      userNameError: "",
      passwordError: "",
      confirmPasswordError: "",
      users: [],
      isLoading: false,
    }
  }
  emptyForm = {
    userDocId:"",
    userName: "",
    password: "",
    confirmPassword: "",
    userNameError: "",
    passwordError: "",
    confirmPasswordError: ""
  }
  componentDidMount = async ()=>{
    await this.loadUsers();
  }
  loadUsers = async ()=>{
    var usersDocs = await firestore().collection( "Users" ).where( "type", "==", "collector" ).get();
    var users = [];
    console.dir(usersDocs);
    usersDocs.docs.forEach((doc)=>{
      users.push({
        key: doc.id,
        ...doc.data()
      });
    });
    this.setState({users: users, isLoading: false});
  }
  onInputChange = (input)=>{
    this.setState({...input});
  }
  onUserEdit = (user)=>{
    this.setState({
      userDocId: user.key,
      userName: user.userId,
      password: user.password,
      confirmPassword: user.password,
    })
  }
  onUserDelete = async (user)=>{

    this.setState({
      isLoading: true,
    }, async ()=>{

      if(user.truck.truckDocId){
        firestore().runTransaction(async (t)=>{
          var truckResult = await t.get(firestore().collection("Trucks").doc(user.truck.truckDocId));
          if(truckResult.exists){
            t.update(firestore().collection("Trucks").doc(user.truck.truckDocId),{
              collectors: truckResult.data().collectors.filter((item)=>{
                            return item.userId !== user.userId
                          })
            });
            
          }
        })
      }
      await firestore().collection("Users").doc(user.key).delete();
      await this.loadUsers();
    })
  }
  validateForm = async ()=>{
    var error = {
      userNameError: "",
      passwordError: "",
      confirmPasswordError: "",
    };
    
    if(this.state.password.length === 0 ) error.passwordError = "Password is required";
    else if(this.state.confirmPassword.length === 0 ) error.confirmPasswordError = "Confirm Password is required";
    else if(this.state.password !== this.state.confirmPassword) error.confirmPasswordError = "Confirm Password and Password does not match";

    if(this.state.userName.length === 0 ) error.userNameError = "Username is required";
    else {
      if(this.state.userDocId){

      }
      else {
        var result = await firestore().collection("Users").where( "userId", "==", this.state.userName ).get();
        if(result.docs.length > 0)  error.userNameError = "Username is not available";
      }
    }
    
    this.setState({...error});
    console.log(error.userNameError.length > 0);
    console.log(error.passwordError.length > 0);
    console.log(error.confirmPasswordError.length > 0);
    if(error.userNameError.length > 0 || error.passwordError.length > 0 || error.confirmPasswordError.length > 0) return false;
    else return true;
  }
  onSave = async (event)=>{
    this.setState({
      isLoading: true
    }, async ()=>{
      if(await this.validateForm()){
        if(this.state.userDocId){
          await firestore().collection("Users").doc(this.state.userDocId).update({
            userId: this.state.userName,
            password: this.state.password
          });
        }
        else {
          await firestore().collection("Users").doc().set({
            userId: this.state.userName,
            password: this.state.password,
            truck: {
              truckId:"",
              truckDocId:"",
              batch:{
                batchId: "",
                pickupLocations: []
              }
            },
            type: "collector",
          });
        }
        this.setState({...this.emptyForm}, async ()=>{
          this.loadUsers();
        })
        console.log("save successful");
      }
      else {
        this.setState({
          isLoading: false
        })
      }
    });
  }
  render() {
    return (
      <div className="row m-5 p-5">
        <div className="col">
          <Form>
            <h4>User Details</h4>
            <FormGroup>
              <Label for="userName">Username</Label>
              <Input required type="text" name="userName" id="userName" placeholder="" 
                {...(this.state.userNameError)?{invalid:true}:{}}
                value={this.state.userName}
                onChange={(event)=>this.onInputChange({userName: event.target.value})}/>
              <FormFeedback>{this.state.userNameError}</FormFeedback>
            </FormGroup>
            <Row form>
              <Col md={6}>
                <FormGroup>
                  <Label for="password">Password</Label>
                  <Input required type="password" name="password" id="password" placeholder="" 
                    {...(this.state.passwordError)?{invalid:true}:{}}
                    value={this.state.password}
                    onChange={(event)=>this.onInputChange({password:event.target.value})}/>
                  <FormFeedback>{this.state.passwordError}</FormFeedback>
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label for="confirmPassword">Confirm Password</Label>
                  <Input required type="password" name="confirmPassword" id="confirmPassword" placeholder="" 
                    {...(this.state.confirmPasswordError)?{invalid:true}:{}}
                    value={this.state.confirmPassword}
                    onChange={(event)=>this.onInputChange({confirmPassword:event.target.value})} />
                  <FormFeedback>{this.state.confirmPasswordError}</FormFeedback>
                </FormGroup>
              </Col>
            </Row>
            <hr />
            <Button
              disabled={this.state.isLoading}
              onClick={(event)=>this.onSave(event)}
             >Save</Button>
          </Form>
        </div>
        <div className="col">
          <h4>User List</h4>
          <ListGroup flush>
            {
              this.state.users.map((user)=>
                <ListGroupItem key={user.key}>
                  <Row>
                    <div>{user.userId}</div>
                    <ButtonGroup size="sm" className="ml-auto">
                      <Button
                        disabled={this.state.isLoading}
                        onClick={()=>{this.onUserEdit(user)}}>Edit</Button>
                      <Button
                        disabled={this.state.isLoading}
                        onClick={()=>{this.onUserDelete(user)}}>Delete</Button>
                    </ButtonGroup>
                  </Row>
                </ListGroupItem>
              )
            }
          </ListGroup>
        </div>
      </div>
    );
  }
}