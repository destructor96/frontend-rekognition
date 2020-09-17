import React, { Component } from "react";
import axios from "axios";
import * as styles from "./FileUpload.module.css";

export default class FileUpload extends Component {
  state = {
    fileToUpload: undefined,
    uploadSuccess: undefined,
    error: undefined,
    feedback: false,
    response: undefined,
    fileKey: undefined,
    rekognitionResult: undefined,
    filePath: undefined,
    predValueDisabled: true,
    predValue: undefined,
    comments: "",
  };

  uploadFile() {
    // Getting the signed url
    axios({
      url:
      process.env.REACT_APP_API_ENDPOINT_UPLOAD_TO_S3 +
        this.state.fileToUpload.name,
      method: "POST",
    }).then((response) => {
      // Getting the url from response
      const url = response.data.fileUploadURL;
      console.log(response);
      this.setState({
        fileKey: response.data.fileKey,
        filePath: response.data.filePath,
      });

      axios({
        method: "PUT",
        url: url,
        data: this.state.fileToUpload,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
        .then((res) => {
          this.setState({
            uploadSuccess: "File upload successfull",
            error: undefined,
          });

          axios({
            method: "PUT",
            url:
              process.env.REACT_APP_API_ENDPOINT_GET_CUSTOM_LABEL,
            data: { fileName: this.state.fileKey },
            headers: {
              "Content-Type": "multipart/form-data",
            },
          })
            .then((response) => {
              this.setState(
                {
                  rekognitionResult: response.data,
                },
                () => {
                  this.setState({
                    feedback: true,
                  });
                  console.log(this.state.rekognitionResult.body[0]);
                }
              );
            })
            .catch((err) => {
              this.setState({ feedback: false, rekognitionResult: null });
              console.log(err);
            });
        })
        .catch((err) => {
          this.setState({
            error: "Error Occured while uploading the file",
            uploadSuccess: undefined,
          });
        });
    });
  }

  updateFeedback = () => {
    axios({
      method: "PUT",
      url:
        process.env.REACT_APP_API_ENDPOINT_PUBLISH_FEEDBACK,
      data: {
        fileName: this.state.filePath,
        correctPred: this.state.predValue,
        comments: this.state.comments,
      },
    })
      .then((response) => {
        this.setState({
          rekognitionResult: undefined,
          feedback: false,
          fileToUpload: undefined,
          fileKey: null,
          filePath: null,
          predValueDisabled: true,
        });
        alert("Feedback Published Successfully");
        window.location.reload();
      })
      .catch((err) => {
        this.setState({
          feedback: false,
          rekognitionResult: null,
          fileToUpload: undefined,
          fileKey: null,
          filePath: null,
          predValueDisabled: true,
        });
        console.log(err);
        alert("Error Publishing Feedback");
      });
  };

  render() {
    return (
      <div>
        <div className='logo'>
          <img src='/cllogo.png' alt='Amazon Rekognition Custom Labels Logo' />
        </div>
        <h2>Amazon Rekognition Custom Labels Project</h2>
        <div className='powered'>powered by Amazon Rekognition</div>
        <div className={styles.fileUploadCont}>
          <div className={styles.header}>
            Choose file to test using Amazon Rekognition Custom Label Model
          </div>
          <div>
            <form>
              <div className='form-group'>
                <input
                  type='file'
                  className='form-control-file'
                  id='fileUpload'
                  onChange={(e) => {
                    this.setState({
                      fileToUpload: e.target.files[0],
                    });
                  }}
                />
                {this.state.fileToUpload ? (
                  <button
                    type='button'
                    className='btn btn-light'
                    onClick={(e) => {
                      this.uploadFile();
                    }}
                  >
                    Upload your file
                  </button>
                ) : null}

                <div>
                  <span>
                    {this.state.uploadSuccess ? "File Upload Successfully" : ""}
                  </span>
                </div>
              </div>
            </form>
          </div>
        </div>
        {this.state.feedback ? (
          <div>
            <h1>Result from Amazon Rekognition</h1>
            <h3>Label: {this.state.rekognitionResult.body[0].Name}</h3>
            <h3>
              Confidence: {this.state.rekognitionResult.body[0].Confidence}
            </h3>
            <div className='form-group'></div>
            <div className='form-group'>
              <label htmlFor='simpleInput'>Prediction Correctness</label>{" "}
              <select
                name='predValue'
                id='predValue'
                onChange={(e) => {
                  if (e.target.value === "false")
                    this.setState({ predValueDisabled: true });
                  else
                    this.setState({
                      predValueDisabled: false,
                      predValue: e.target.value,
                    });
                }}
              >
                <option value={false}></option>
                <option value='Yes'>Yes</option>
                <option value='No'>No</option>
              </select>
              <label htmlFor='simpleInput'>Comments</label>{" "}
              <input
                type='text'
                className='feedback-form'
                id='simpleInput'
                onChange={(e) => {
                  this.setState(
                    {
                      comments: e.target.value,
                    },
                    () => {
                      console.log(this.state);
                    }
                  );
                }}
              />
            </div>
            <div className='form-group'>
              <button
                type='button'
                className='btn btn-primary'
                disabled={this.state.predValueDisabled}
                onClick={this.updateFeedback}
              >
                Submit
              </button>{" "}
              {/* Some form attributes use an expression to set true or false: they include disabled, required, checked and readOnly */}
            </div>
          </div>
        ) : null}
      </div>
    );
  }
}
