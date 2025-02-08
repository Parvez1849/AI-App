
import { useState } from 'react';
import './App.css';

function App() {
  const [question,setQuestion] = useState('');

  const submitHandler = (e)=>{
    e.preventDefault();
    console.log(question)
    axios.post('https://gemini-app-pied.vercel.app/getResponse',{
      question:question
    })
    .then(res=>{
      console.log(res.data);
    })
    .catch(err=>{
      console.log(err)
    })
  }
  return (
    <div className="App">
     <div className='box'>
      <div className='profile-pic'>
        <img className='pic' src={require('../src/assets/khan.JPG')}/>
      </div>
      <p className='lebel'>Question</p>
      <textarea onChange={(e)=>{setQuestion(e.target.value)}}></textarea>
     <button onClick={submitHandler}>Send</button>
     </div>
     <div className='box'>
     <div className='profile-pic'>
        <img className='pic' src={require('../src/assets/gemini.jpg')}/>
      </div>
      <p className='lebel'>Response</p>
      <textarea></textarea>
     <button>Speak</button>
     </div>
    </div>
  );
}

export default App;

