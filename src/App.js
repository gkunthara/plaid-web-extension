import React, { Component } from 'react';
import axios from 'axios';
import { Pane, Text, minorScale, majorScale, Heading, Spinner } from 'evergreen-ui';
import './App.css';
import NumberFormat from 'react-number-format';
import PlaidLink from 'react-plaid-link'
import Cookies from 'universal-cookie';

const cookies = new Cookies();
const PLAID_PUBLIC_KEY = process.env.REACT_APP_PLAID_PUBLIC_KEY


class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      accessToken: cookies.get("accessToken"),
      accounts: []
    };
    this.handleOnSuccess = this.handleOnSuccess.bind(this);
    this.getBalances = this.getBalances.bind(this);
  }

  componentDidMount(){
    this.getBalances()
  }

  async handleOnSuccess(token, metadata) {
    try {
      const response = await axios.post('http://localhost:3001/plaid_exchange', { public_token: token });
      console.log('👉 Returned data:', response.data);
      cookies.set("accessToken", response.data.access_token, {path: "/"});
      cookies.set("bank_account_linked", true, {path: "/"});
      window.localStorage.setItem('bank', metadata.institution.name);
      this.getBalances()
    } catch (e) {
      console.log(`😱 Axios request failed: ${e}`);
    }
  }
  handleOnExit() {
    // handle the case when your user exits Link
    console.log("bye")
  }

  async getBalances(){
    try {
      const response = await axios.post('http://localhost:3001/balances', { access_token: cookies.get("accessToken")});
      console.log('👉 Returned balances data:', response.data);
      this.setState({
        accounts: response.data.balances.accounts
      })
    } catch (e) {
      console.log(`😱 Axios request failed: ${e}`);
    }
  }

  // Shows list of accounts and balances associated to the linked institution
  renderBankInfo(){
    if(this.state.accounts.length !== 0){
      return this.state.accounts.map((account, idx) => {
        return (
          <Pane
            key={idx}
            display="flex"
            borderRadius={6}
            elevation={1}
            background="tint1"
            padding={16}
            marginTop={majorScale(2)}
            marginRight={minorScale(2)}
            width={300}
            height={50}
            alignItems="center"
          >
            <Pane flex={1} alignItems="center" display="flex">
              <Text size={500}>{account.name}</Text>
            </Pane>
            <Pane>
            <Heading size={500} marginRight={24}>
              <NumberFormat value={account.balances.available} displayType={'text'} thousandSeparator={true} prefix={'$'} />
            </Heading>
            </Pane>
          </Pane>
        );
      });
  }

  }

render(){

  // If first time opening application
  if(!(cookies.get("bank_account_linked"))){
    return (
      <div className="App">
        <PlaidLink
            clientName="Basic Plaid Extension"
            env="sandbox"
            product={["auth", "transactions"]}
            publicKey={PLAID_PUBLIC_KEY}
            onExit={this.handleOnExit}
            onSuccess={this.handleOnSuccess}>
            Open Link and connect your bank
          </PlaidLink>
      </div>
    )
  }
  // Show loading icon while getting data
  else if(this.state.accounts.length === 0){
    return (
          <Pane
            background="tint1"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Spinner />
          </Pane>
    )
  }
else {
    return (
      <Pane>
        <Pane display="flex"
            alignItems="center"
            justifyContent="center" 
            padding={6}>
          <Heading size={600}>{window.localStorage.getItem('bank')}</Heading>
        </Pane>
        <Pane padding={8}>
          {this.renderBankInfo()}
        </Pane>
      </Pane>
    );
  }
  }
}

export default App;
