import React, { Component } from 'react';
import './App.css';

const FONT_SIZE = '12px';
const LETTER_WIDTH = 7;
const LETTER_HEIGHT = 12;
const LINE_HEIGHT = '12px';
const TICK_TIME_MS = 16;
const WAVE_OFFSET_FROM_BOTTOM = 30;

const SPRING_CONSTANT = 0.005;
const SPRING_CONSTANT_BASELINE = 0.005;
const DAMPING = 0.99;
const ITERATIONS = 5;

const NUM_BACKGROUND_WAVES = 7;
const BACKGROUND_WAVE_MAX_HEIGHT = 6;
const BACKGROUND_WAVE_COMPRESSION = 0.1;

const WAVE_CHARACTERS = '^`\'~*-,._';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      dimenstions: null,
      tick: 0,
      mouseCol: null
    }
    this.sineOffsets = [];
    this.sineAmplitudes = [];
    this.sineStretches = [];
    this.offsetStretches = [];

    for (let i = 0; i < NUM_BACKGROUND_WAVES; ++i) {
      this.sineOffsets.push(-Math.PI + 2 * Math.PI * Math.random());
      this.sineAmplitudes.push(Math.random() * BACKGROUND_WAVE_MAX_HEIGHT);
      this.sineStretches.push(Math.random() * BACKGROUND_WAVE_COMPRESSION);
      this.offsetStretches.push(Math.random() * BACKGROUND_WAVE_COMPRESSION);
    }
  }

  componentDidMount() {
    const canvasElement = document.querySelector('#canvas');
    const canvasRect = canvasElement.getBoundingClientRect();
    const dimensions = {
      width: Math.floor(canvasRect.width / LETTER_WIDTH),
      height: Math.floor(canvasRect.height / LETTER_HEIGHT),
      widthPx: canvasRect.width,
      heightPx: canvasRect.height
    };
    this.setState({
      dimensions,
      points: this.makeWavePoints(dimensions.width)
    });
    this.interval = setInterval(this.tick, TICK_TIME_MS);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  handleMouseOver = e => {
    const { dimensions } = this.state;
    let mouseCol = Math.floor((e.screenX / dimensions.widthPx) * dimensions.width);
    this.setState({ mouseCol });
  }

  handleMouseLeave = e => {
    this.setState({ mouseCol: null });
  }

  handleMouseClick = e => {
    
  }

  makeWavePoints = numPoints => {
    const { dimensions } = this.state;
    const t = [];
    for (let n = 0; n < numPoints; n++) {
        // This represents a point on the wave
        let newPoint = {
            x: n,
            y: WAVE_OFFSET_FROM_BOTTOM,
            spd: {
              y:0
            }, // speed with vertical component zero
            mass: 1
        }
        t.push(newPoint);
    }
    return t;
  }

  overlapSines = x => {
    const { tick } = this.state;
    let result = 0;
    for (let i = 0; i < NUM_BACKGROUND_WAVES; ++i) {
        result = result
            + this.sineOffsets[i]
            + this.sineAmplitudes[i] 
            * Math.sin(x * this.sineStretches[i] + tick * this.offsetStretches[i]);
    }
    return result;
  }

  tick = () => {
    const { tick } = this.state;
    this.setState({
      tick: tick + 1
    });
  }

  render() {
    const { dimensions, points, tick, mouseCol } = this.state;

    let grid = null;
    if (dimensions) {
      grid = [];
      for (let row = 0; row < dimensions.height; row++) {
        let cells = [];
        for (let col = 0; col < dimensions.width; col++) {
          const isMouseCol = mouseCol !== null && col === mouseCol;
          cells.push(<span className={`cell ${ isMouseCol ? 'mouseline' : '' }`} key={ col }>{ isMouseCol ? '|' : ' ' }</span>);
        }
        grid.push(<div className="row" key={ row }>{ cells }</div>);
      }

      for (let point of points) {
        const col = point.x;
        const y = point.y + this.overlapSines(col);
        const row = Math.floor(y);

        const charIndex = Math.floor(Math.floor(y*10 % 10) / 10 * WAVE_CHARACTERS.length);
        grid[row].props.children[col] = <span className="cell" key={ col }>{ WAVE_CHARACTERS[charIndex] }</span>;
      }
    }

    return (      
      <div
        style={{
          height: '100vh',
          width: '100vw',
        }}
        id="canvas"
        onMouseOver={ this.handleMouseOver }
        onMouseLeave={ this.handleMouseLeave }
        handleMouseClick={ this.handleMouseClick }
      >
        { grid }
      </div>
    );
  }
}

export default App;
