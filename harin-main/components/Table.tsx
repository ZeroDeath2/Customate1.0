"use client";
import React, { useEffect, useState } from "react";
import { CardTitle, CardHeader, CardContent, Card } from "@/components/ui/card";
import {
  TableHead,
  TableRow,
  TableHeader,
  TableCell,
  TableBody,
  Table,
} from "@/components/ui/table";
import { supabase } from "@/utils/supabase/client";
import axios from "axios";

type Ticket = {
  id: number;
  phone_no: string;
  chat_summary: string;
  tag: string[];
  time: string; // Assuming time is a string in ISO format
};

// Define the type for chat_summary
type ChatSummaryData = {
  chat_summary: string;
  id: number;
  phone_no: string;
  tag: string[];
  time: string;
};
type ChatLog = {
  id: number;
  created_at: string;
  chatlog: string;
};

export default function Table1() {
  const [ticketData, setTicketData] = useState<ChatSummaryData[]>([]);
  const [chatLog, setChatLog] = useState<ChatLog[]>([]);
  const [allData, setAllData] = useState<(ChatSummaryData & ChatLog)[]>([]);
  const [tempData, setTempData] = useState<ChatSummaryData[]>([]);
  const [chatSummary, setChatSummary] = useState<ChatSummaryData[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: ticketData, error: ticketError } = await supabase
          .from("tickettable")
          .select();
        const { data: chatLogData, error: chatLogError } = await supabase
          .from("buffer")
          .select()
          .order("created_at", { ascending: false })
          .limit(1);

        if (ticketData && chatLogData) {
          console.log(ticketData);
          console.log("buffer",chatLogData);
          
          // Make single API call to summarize all chat logs
          const response_summary = await axios.post(
            "https://api.openai.com/v1/chat/completions",
            {
              model: "gpt-3.5-turbo",
              messages: [
                {
                  role: "system",
                  content: `summurize the chat: ${chatLogData[0].chatlog}`,
                },
              ],
            },
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
              },
            }
          );
          console.log("gpt",response_summary.data.choices[0].message.content);
          const summarizedChatLogs = response_summary.data.choices[0].message.content;


          const response_tag = await axios.post(
            "https://api.openai.com/v1/chat/completions",
            {
              model: "gpt-3.5-turbo",
              messages: [
                {
                  role: "system",
                  content: `Choose One tag, the most appropriete from (Greenline,black screen,liquid damage,warranty issue,battery life)  ${summarizedChatLogs}`,
                },
              ],
            },
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
              },
            }
          );
          console.log("tags :",response_tag.data.choices[0].message.content);
          const contentArray: string[] = response_tag.data.choices[0].message.content.split(',');
          // Extract summarized chat logs from API response
          const { data: insert, error: err } = await supabase
            .from("tickettable")
            .insert([{ chat_summary: summarizedChatLogs ,tag: contentArray}])
          const { data: chatSummary, error: chatLogError } = await supabase
            .from("tickettable")
            .select();
          if (chatSummary) {
            setTempData(chatSummary);
          }
          console.log("tempData", tempData);

        }

        if (ticketError || chatLogError) {
          throw ticketError || chatLogError;
        }
      } catch (error) {
        console.error("Error fetching data:");
      }
    };

    fetchData();
  }, []);

  console.log(allData);

  return (
    <div>
      <div>
        <div>Customer Support Dashboard</div>
      </div>
      <div>
        <Card>
          <CardHeader>
            <CardTitle>Customer Support Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">ID</TableHead>
                  <TableHead>Phone number</TableHead>
                  <TableHead>Chat summary</TableHead>
                  <TableHead>Tags</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tempData.map((log, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{log.id}</TableCell>
                    <TableCell>{log.phone_no}</TableCell>
                    <TableCell>{log.chat_summary}</TableCell>
                    {/* Assuming tags are available in ticketData */}
                    <TableCell>{log.tag}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
