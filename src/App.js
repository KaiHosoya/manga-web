import React, { useState } from 'react';
import axios from 'axios';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

const App = () => {
    const [imageSrc, setImageSrc] = useState(null);
    const [recognizedTexts, setRecognizedTexts] = useState([]);
    const [selectedNames, setSelectedNames] = useState({});
    const [audioSrc, setAudioSrc] = useState(null);
    // 追加する状態
    const [editingIndex, setEditingIndex] = useState(null);
    const [editingTranslatedText, setEditingTranslatedText] = useState("");

        // ドラッグアンドドロップのための関数
    const reorder = (list, startIndex, endIndex) => {
        const result = Array.from(list);
        const [removed] = result.splice(startIndex, 1);
        result.splice(endIndex, 0, removed);
        return result;
    };

    const onDragEnd = (result) => {
        if (!result.destination) {
            return;
        }
    
        const items = reorder(
            recognizedTexts,
            result.source.index,
            result.destination.index
        );
    
        const oldName = selectedNames[result.source.index];
        let reorderedNames = {...selectedNames};
    
        delete reorderedNames[result.source.index];
    
        // Shifting the names in the selectedNames
        if (result.source.index < result.destination.index) {
            for (let i = result.source.index; i < result.destination.index; i++) {
                reorderedNames[i] = selectedNames[i + 1];
            }
        } else {
            for (let i = result.source.index; i > result.destination.index; i--) {
                reorderedNames[i] = selectedNames[i - 1];
            }
        }
    
        reorderedNames[result.destination.index] = oldName;
    
        setRecognizedTexts(items);
        setSelectedNames(reorderedNames);
    };
    

    const handleEditClick = (index, text) => {
        setEditingIndex(index);
        setEditingTranslatedText(text);
    };

    const handleSaveEdit = (index) => {
        const updatedTexts = [...recognizedTexts];
        updatedTexts[index].translated_text = editingTranslatedText;
        setRecognizedTexts(updatedTexts);
        setEditingIndex(null);
        setEditingTranslatedText("");
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onloadend = () => {
            setImageSrc(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const handleCapture = async () => {
        try {
            const clipboardItems = await navigator.clipboard.read();
            const clipboardBlob = await clipboardItems[0].getType('image/png');
            const formData = new FormData();
            formData.append('image', clipboardBlob, 'captured-image.png');

            const response = await axios.post('http://127.0.0.1:5000/process-image', formData);
            // const response = await axios.post('https://still-atoll-35897-1bdcb2b2cb2f.herokuapp.com/process-image', formData);
            console.log(response.data);
            setRecognizedTexts(prevTexts => [...prevTexts, response.data]);

            alert("Image sent to the backend!");
        } catch (error) {
            console.error("Error capturing image from clipboard:", error);
            alert("Failed to capture the image from the clipboard.");
        }
    };

    const handleNameChange = (index, name) => {
      setSelectedNames(prevNames => ({ ...prevNames, [index]: name }));
    }

    const handleButtonClick = async () => {
      const requestData = recognizedTexts.map((textData, index) => ({
          name: selectedNames[index] || "21m00Tcm4TlvDq8ikWAM", // 名前が選択されていなければRachelをセット
          text: textData.translated_text
      }));
      
      try {
        console.log("requestData: ", requestData);
          const res = await axios.post('http://127.0.0.1:5000/submit-data', requestData);
        //   const res = await axios.post('https://still-atoll-35897-1bdcb2b2cb2f.herokuapp.com/submit-data', requestData);
          console.log("url: ", res.data);
          setAudioSrc(res.data.audio_file);
          // alert("Data sent to the backend!");
      } catch (error) {
          console.error("Error sending data to backend:", error);
          alert("Failed to send data to the backend.");
      }
    };

  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', alignItems: 'center' }}>
        {/* Header */}
        <header style={{ width: '100%', padding: '10px 0', background: '#8C86FC', color: 'white', textAlign: 'center', marginBottom: '20px' }}>
            <h1>画像処理Webアプリ</h1>
        </header>
        <div style={{ display: 'flex', width: '90%', height: '85%', overflow: 'hidden' }}>
          {/* 左側: 画像の表示 */}
          <div style={{ flex: 1, maxWidth: '70%', padding: '20px', border: '1px solid #e0e0e0', borderRadius: '8px', marginRight: '20px' }}>
            <input type="file" onChange={handleImageChange} />
            {imageSrc ? (
                <img src={imageSrc} alt="Uploaded Preview" style={{ width: '100%', marginTop: '20px', maxHeight: '600px', objectFit: 'contain'  }} />
            ) : (
                <div style={{ textAlign: 'center', padding: '20px', color: '#888' }}>画像を選択してください</div>
            )}
            <Button 
                variant="contained" 
                color="secondary" 
                style={{ marginTop: '20px', width: '100%' }} 
                onClick={handleCapture}
            >
                Capture & Translate
            </Button>

            {/* 音声の再生 */}
            { audioSrc &&
                <audio key={audioSrc} id="audio" controls="controls" style={{ marginTop: '20px', width: '100%' }}>
                    <source src={audioSrc} type="audio/mp3" />
                </audio>
            }
          </div>
          {/* 右側: 文言の表示 */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '20px' }}>
          <DragDropContext onDragEnd={onDragEnd}>
  <Droppable droppableId={"dndTableBody"}>
    {(provided) => (
      <div
        {...provided.droppableProps}
        ref={provided.innerRef}
        style={{ overflowY: 'auto', flex: 1 }}
      >
        {recognizedTexts.map((textData, index) => (
          <Draggable key={index} draggableId={String(index)} index={index}>
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.draggableProps}
                {...provided.dragHandleProps}
              >
                <Card key={index} sx={{ marginBottom: 2 }}>
                  <CardContent style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      {editingIndex === index ? (
                        <>
                          <textarea 
                            value={editingTranslatedText}
                            onChange={(e) => setEditingTranslatedText(e.target.value)}
                            style={{ width: '100%', padding: '5px', boxSizing: 'border-box' }}
                          />
                          <Button onClick={() => handleSaveEdit(index)}>Save</Button>
                        </>
                      ) : (
                        <>
                          {textData.text} <br />
                          {textData.translated_text}
                          <Button onClick={() => handleEditClick(index, textData.translated_text)}>Edit</Button>
                        </>
                      )}
                    </div>
                    <Select 
                      value={selectedNames[index] || ""}
                      label="Name" 
                      onChange={(e) => handleNameChange(index, e.target.value)}
                    >
                      <MenuItem value={"21m00Tcm4TlvDq8ikWAM"}>Rachel</MenuItem>
                      <MenuItem value={"2EiwWnXFnvU5JabPnv8n"}>Daniel</MenuItem>
                      <MenuItem value={"MF3mGyEYCl7XYWbV9V6O"}>Nicole</MenuItem>
                      <MenuItem value={"LcfcDJNUP1GQjkzn1xUU"}>Glinda</MenuItem>
                      <MenuItem value={"N2lVS1w4EtoT3dr4eOWO"}>Mimi</MenuItem>
                    </Select>
                  </CardContent>
                </Card>
              </div>
            )}
          </Draggable>
        ))}
        {provided.placeholder}
      </div>
    )}
  </Droppable>
</DragDropContext>

            <div style={{ textAlign: 'center', marginButtom: 'auto', flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={handleButtonClick}
                    title="Send the recognized texts to the backend for further processing."
                >
                    vocalization
                </Button>
            </div>
          </div>
        </div>
      </div>
  );
}

export default App;
