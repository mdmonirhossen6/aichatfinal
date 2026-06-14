import React, { useState } from 'react';
import { UploadCloud, User, Clock, MessageSquare } from 'lucide-react';

export default function ChatDashboard() {
  const [chatData, setChatData] = useState({});
  const [selectedUser, setSelectedUser] = useState(null);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      
      // Robust CSV parser that handles newlines and semicolons inside quotes
      const parseCSV = (csvText) => {
        const lines = [];
        let currentLine = [];
        let currentField = '';
        let inQuotes = false;

        for (let i = 0; i < csvText.length; i++) {
          const char = csvText[i];
          const nextChar = csvText[i + 1];

          if (inQuotes) {
            if (char === '"') {
              if (nextChar === '"') {
                // Escaped double quote
                currentField += '"';
                i++; // skip next quote
              } else {
                // End of quoted field
                inQuotes = false;
              }
            } else {
              currentField += char;
            }
          } else {
            if (char === '"') {
              inQuotes = true;
            } else if (char === ';') {
              currentLine.push(currentField);
              currentField = '';
            } else if (char === '\r') {
              // Ignore carriage return
            } else if (char === '\n') {
              currentLine.push(currentField);
              lines.push(currentLine);
              currentLine = [];
              currentField = '';
            } else {
              currentField += char;
            }
          }
        }
        if (currentField || currentLine.length > 0) {
          currentLine.push(currentField);
          lines.push(currentLine);
        }
        return lines;
      };

      const rows = parseCSV(text);
      const grouped = {};

      // Skip header row
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.length < 5) continue;

        const id = row[0].trim();
        const user_id = row[1].trim();
        const role = row[2].trim();
        const content = row[3];
        const created_at = row[4].trim();

        if (!user_id || !role || !content) continue;

        if (!grouped[user_id]) {
          grouped[user_id] = [];
        }
        grouped[user_id].push({ id, role, content, created_at });
      }

      // Time wise sort (ascending - oldest to newest)
      Object.keys(grouped).forEach(userId => {
        grouped[userId].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      });

      setChatData(grouped);

      // Select the user with the most recent activity first
      const sortedUsers = Object.keys(grouped).sort((a, b) => {
        const lastMsgA = grouped[a][grouped[a].length - 1];
        const lastMsgB = grouped[b][grouped[b].length - 1];
        return new Date(lastMsgB.created_at) - new Date(lastMsgA.created_at);
      });

      if (sortedUsers.length > 0) {
        setSelectedUser(sortedUsers[0]);
      }
    };
    reader.readAsText(file);
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const sortedUserIds = Object.keys(chatData).sort((a, b) => {
    const lastMsgA = chatData[a][chatData[a].length - 1];
    const lastMsgB = chatData[b][chatData[b].length - 1];
    return new Date(lastMsgB.created_at) - new Date(lastMsgA.created_at);
  });

  return (
    <div className="min-h-screen bg-[#0a0f1c] text-white p-6 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Header & Upload Section */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-[#111827] p-6 rounded-2xl border border-cyan-900/50 shadow-[0_0_15px_rgba(6,182,212,0.15)] mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500 mb-2">
              AI Chat Analyzer
            </h1>
            <p className="text-slate-400 text-sm">Upload your messy CSV to view clean, sorted chat logs</p>
          </div>
          
          <div className="mt-4 md:mt-0 relative">
            <input 
              type="file" 
              accept=".csv" 
              onChange={handleFileUpload} 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 px-6 py-3 rounded-xl font-medium transition-all shadow-lg shadow-cyan-500/25">
              <UploadCloud size={20} />
              <span>Upload CSV File</span>
            </div>
          </div>
        </div>

        {Object.keys(chatData).length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* User List Sidebar */}
            <div className="bg-[#111827] border border-slate-800 rounded-2xl p-4 h-[70vh] overflow-y-auto custom-scrollbar">
              <h2 className="text-lg font-semibold text-slate-300 mb-4 px-2 flex items-center gap-2">
                <User size={18} className="text-purple-400" />
                User IDs
              </h2>
              <div className="space-y-2">
                {sortedUserIds.map((userId) => (
                  <button
                    key={userId}
                    onClick={() => setSelectedUser(userId)}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-all truncate text-sm ${
                      selectedUser === userId 
                        ? 'bg-slate-800 border border-cyan-500/30 text-cyan-300' 
                        : 'hover:bg-slate-800/50 text-slate-400'
                    }`}
                  >
                    {userId}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat View Area */}
            <div className="lg:col-span-3 bg-[#111827] border border-slate-800 rounded-2xl flex flex-col h-[70vh]">
              <div className="p-4 border-b border-slate-800 bg-[#161f33] rounded-t-2xl flex items-center gap-3">
                <MessageSquare className="text-cyan-400" size={20} />
                <span className="font-mono text-sm text-cyan-100">{selectedUser}</span>
                <span className="ml-auto text-xs bg-slate-800 text-slate-300 px-3 py-1 rounded-full border border-slate-700">
                  {chatData[selectedUser]?.length} Messages
                </span>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                {chatData[selectedUser]?.map((msg, index) => {
                  const isUser = msg.role === 'user';
                  return (
                    <div key={index} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-center gap-2 mb-1 px-1">
                        <span className="text-xs font-medium text-slate-400 capitalize">{msg.role}</span>
                        <Clock size={12} className="text-slate-500" />
                        <span className="text-[10px] text-slate-500">{formatDate(msg.created_at)}</span>
                      </div>
                      <div className={`max-w-[80%] px-5 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-md ${
                        isUser 
                          ? 'bg-gradient-to-br from-cyan-600/90 to-blue-700/90 text-white rounded-tr-sm' 
                          : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-sm'
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
          </div>
        )}
      </div>
    </div>
  );
}
