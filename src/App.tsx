import { Component } from 'solid-js';

import SystemMap from './SystemMap/SystemMap';


const App: Component = () => {

  return (
    <div>
      <p class="text-4xl text-green-700 text-center py-5">Hello tailwind!</p>
      <SystemMap id="abc" />
    </div>
  );
};

export default App;
