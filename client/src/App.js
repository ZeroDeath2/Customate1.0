import './App.css';
import React, { useState, useEffect } from 'react';
import supabase from './supabase.js';
import axios from 'axios';

function App() {
  console.log(process.env.OPENAI_API_KEY)
  const [Chatlog, setChatlog] = useState([]);
  const [temp, setTemp] = useState([]);
  useEffect(() => {
    // Function to fetch data from Supabase table
    const fetchData = async () => { 
      try {
        // Replace 'your_table_name' with the name of your Supabase table
        const { data, error } = await supabase.from('tickettable').select();
        console.log(data);
        if (error) {
          throw error;
        }
        setChatlog(data); // Update state with fetched data
      } catch (error) {
        console.error('Error fetching data:', error.message);
      }
    };
    fetchData();
    const fetchForSum = async () => { 
      try {
        // Replace 'your_table_name' with the name of your Supabase table
        const { data, error } = await supabase.from('buffer').select().order('created_at', { ascending: true }).limit(1);
        console.log(data+"last row");
        if (error) {
          throw error;
        }
        setTemp(data); // Update state with fetched data
      } catch (error) {
        console.error('Error fetching data:', error.message);
      }
    };
    fetchForSum();

    
   const makeApiRequest = async (temp) => {
      try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
          model: 'davinci-002',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant.'
            },
            {
              role: 'user',
              content: temp
            }
          ]
        }, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
          }
        });
        console.log(response.data); // Handle the response data accordingly
      } catch (error) {
        console.error('Error making API request:', error.message);
      }
    };
    makeApiRequest();
  


  
 

    const insertData = async (temp) => {
      const { data, error } = await supabase.from('tickettable').insert([
        { chat_summary: temp[0].chatlog }
      ]);
      console.log(data);
      if (error) {
        throw error;
      }
    }
    insertData(temp);
  }, []);   
  return (
    <div class="container-fluid">
    <div class="row">

      <div class="col-md-2 side-panel">
        <h3>Customate</h3>
        <div class="list-group" id="itemList">
        </div>
      </div>

      <div class="col-md-9 dashboard-content">
        <h1>Dashboard</h1>
        <div className="px-5 mt-3">
      <div className="d-flex justify-content-center">
        <h3>Complaint Requests</h3> 
      </div>
      <div className="tableItems">
      <div className="mt-3">
        <table className="table">
          <thead>
            <tr>
              <th>Ref. Id</th>
              <th>Time</th>
              <th>Phone Number</th>
              <th>Tags</th>
              <th>Chat Summary</th>
            </tr>
          </thead>
          <tbody>
            {Chatlog.map((e) => (
              <tr>
                <td>{e.id}</td>
                <td>{e.time}</td>
                <td>{e.phone_no}</td>
                <td>{e.tag}</td>
                <td>{e.chat_summary}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </div>
    </div>
      </div>
    </div>
  </div>
  );
}

export default App;
