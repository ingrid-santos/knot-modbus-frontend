import React, { Component } from 'react';
import './App.css';
// import Button from '@material-ui/core/Button';
import Snackbar from '@material-ui/core/Snackbar';
import SlaveService from './services/Slave';
import SlaveCard from './components/SlaveCard';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      renderCard: false,
      slaves: [],
      slaveSrv: new SlaveService(),
      openSnack: false,
      messageSnack: ''
    };
  }

  componentDidMount() {
    this.timer = setTimeout(() => {
      this.listSlaves();
    }, 1);
    console.log('ComponentDidMount()');
  }

  listSlaves() {
    const { slaveSrv } = this.state;
    slaveSrv.listSlaves()
      .then((slaves) => {
        this.setState({ renderCard: true, slaves });
      })
      .catch((err) => {
        this.setState({ openSnack: true, messageSnack: err.message });
      });
  }


  slaveAdded() {

  }


  renderCardSlaves() {
    const { slaves } = this.state;
    return slaves.map(slave => <SlaveCard key={slave.id} slave={slave} />);
  }

  render() {
    const { renderCard, openSnack, messageSnack } = this.state;
    return (
      <div className="App">
        <Snackbar
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left'
          }}
          open={openSnack}
          autoHideDuration={3000}
          onClose={() => this.setState({ openSnack: false })}
          message={messageSnack}
        />

        { renderCard === true ? this.renderCardSlaves() : null }
      </div>
    );
  }
}

export default App;
