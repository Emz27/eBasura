import React from 'react';
import { Col, Row, Button, ButtonGroup, Form, FormGroup, FormFeedback, Label, Input, ListGroup, ListGroupItem } from 'reactstrap';

import { firestore } from 'firebase';
import 'firebase/firestore';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import 'react-bootstrap-table-next/dist/react-bootstrap-table2.min.css';
import 'react-bootstrap-table2-filter/dist/react-bootstrap-table2-filter.min.css';
import 'react-bootstrap-table2-paginator/dist/react-bootstrap-table2-paginator.min.css'
import 'react-bootstrap-table2-toolkit/dist/react-bootstrap-table2-toolkit.min.css';

import BootstrapTable from 'react-bootstrap-table-next';
import filterFactory, { textFilter } from 'react-bootstrap-table2-filter';
import paginationFactory from 'react-bootstrap-table2-paginator';
import ToolkitProvider, { CSVExport } from 'react-bootstrap-table2-toolkit';

import moment from 'moment';

const { ExportCSVButton } = CSVExport


export default class Collections extends React.Component {
  constructor(){
    super();
    this.state = {
      collections: [],
    }
  }
  componentDidMount(){
    this.collectionListener = firestore().collection("Collections").onSnapshot((snapShot)=>{
      var collections = [];
      if(snapShot.docs.length){
        snapShot.docs.forEach((doc)=>{
          var data = {
            ...doc.data(),
            collectionDocId: doc.id,
            key: doc.id,
            dateTime: new Date(doc.data().dateTime.toDate())
          }
          collections.push(data);
        })
        this.setState({ collections })
      }
    })
  }
  componentWillUnmount(){
    this.collectionListener();
  }
  render() {
    return (
      <div className="col row p-5 overflow-auto">
        <ToolkitProvider
          keyField="key"
          data={ this.state.collections }
          columns={ [
            {

              text: "Pickup ID",
              dataField: "pickupDocId",
              sort: true,
              filter: textFilter(),
              sortCaret:(order, column) => {
                if(order == "asc") return <FontAwesomeIcon className="ml-1" icon="caret-down" />
                else if(order == "desc") return <FontAwesomeIcon className="ml-1" icon="caret-up" />
              },
            },
            {

              text: "Status",
              dataField: "status",
              sort: true,
              filter: textFilter(),
              sortCaret:(order, column) => {
                if(order == "asc") return <FontAwesomeIcon className="ml-1" icon="caret-down" />
                else if(order == "desc") return <FontAwesomeIcon className="ml-1" icon="caret-up" />
              },
            },
            {
              text: "Collector",
              dataField: "collectors",
              sort: true,
              filter: textFilter(),
              sortCaret:(order, column) => {
                if(order == "asc") return <FontAwesomeIcon className="ml-1" icon="caret-down" />
                else if(order == "desc") return <FontAwesomeIcon className="ml-1" icon="caret-up" />
              },
            },
            {
              text: "Truck",
              dataField: "truckId",
              sort: true,
              filter: textFilter(),
              sortCaret:(order, column) => {
                if(order == "asc") return <FontAwesomeIcon className="ml-1" icon="caret-down" />
                else if(order == "desc") return <FontAwesomeIcon className="ml-1" icon="caret-up" />
              },
            },
            {
              text: "Batch",
              dataField: "batchId",
              sort: true,
              filter: textFilter(),
              sortCaret:(order, column) => {
                if(order == "asc") return <FontAwesomeIcon className="ml-1" icon="caret-down" />
                else if(order == "desc") return <FontAwesomeIcon className="ml-1" icon="caret-up" />
              },
            },
            {
              text: "Date & Time",
              dataField: "dateTime",
              sort: true,
              filter: textFilter(),
              formatter: function(cell, row){
                var dateTime = row.dateTime;
                if(row.status === "pending")dateTime = row.dateTime;
                else if(row.status === "collected")dateTime = row.dateTimeCollected.toDate();
                else if(row.status === "skipped")dateTime = row.dateTimeSkipped.toDate();
                return (
                  <div>
                    <div className="text-center">{moment(dateTime).format("DD/MM/YYYY")}</div>
                    <div className="text-center">{moment(dateTime).format("h:mm a")}</div>
                  </div>
                )
              },
              sortCaret:(order, column) => {
                if(order == "asc") return <FontAwesomeIcon className="ml-1" icon="caret-down" />
                else if(order == "desc") return <FontAwesomeIcon className="ml-1" icon="caret-up" />
              },
            },
          ] }
          exportCSV
        >
          {
            props => (
              <div>
                <ExportCSVButton { ...props.csvProps }>Export CSV</ExportCSVButton>
                <hr />
                <BootstrapTable { ...props.baseProps } filter={ filterFactory() } pagination={ paginationFactory() }/>
              </div>
            )
          }
        </ToolkitProvider>


      </div>
    );
    
  }
}