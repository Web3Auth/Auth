import React, { useState, useContext } from "react";

import { useHistory } from "react-router-dom";

import { makeStyles } from "@material-ui/core/styles";
import Box from "@material-ui/core/Box";
import Grid from "@material-ui/core/Grid";
import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";
import Paper from "@material-ui/core/Paper";

import { useValidCode, useValidEmail } from "../../hooks/useAuthHooks";
import { Code, Email } from "../../components/authComponents";

import { AuthContext } from "../../contexts/authContext";

const useStyles = makeStyles({
  root: {
    height: "100vh",
  },
  hover: {
    "&:hover": { cursor: "pointer" },
  },
});

const VerifyCode: React.FunctionComponent<{}> = () => {
  const classes = useStyles();

  const { email, setEmail, emailIsValid } = useValidEmail("");
  const { code, setCode, codeIsValid } = useValidCode("");
  const [error, setError] = useState("");

  const isValid = !emailIsValid || email.length === 0 || !codeIsValid || code.length === 0;

  const history = useHistory();

  const authContext = useContext(AuthContext);

  const sendClicked = async () => {
    try {
      await authContext.verifyCode(email, code);
      history.push("signin");
    } catch (err) {
      setError("Invalid Code");
    }
  };

  return (
    <Grid className={classes.root} container direction="row" justifyContent="center" alignItems="center">
      <Grid xs={11} sm={6} lg={4} container direction="row" justifyContent="center" alignItems="center" item>
        <Paper style={{ width: "100%", padding: 32 }}>
          <Grid container direction="column" justifyContent="center" alignItems="center">
            {/* Title */}
            <Box m={2}>
              <Typography variant="h3">Submit Code</Typography>
            </Box>

            {/* Sign In Form */}
            <Box width="80%" m={1}>
              <Email emailIsValid={emailIsValid} setEmail={setEmail} />
              {/* <Username usernameIsValid={usernameIsValid} setUsername={setUsername} />{" "} */}
            </Box>
            <Box width="80%" m={1}>
              <Code codeIsValid={codeIsValid} setCode={setCode} />
              <Grid container direction="row" justifyContent="flex-start" alignItems="center">
                <Box mt={2}>
                  <Typography color="error" variant="body2">
                    {error}
                  </Typography>
                </Box>
              </Grid>
            </Box>

            {/* Buttons */}
            <Box mt={2}>
              <Grid container direction="row" justifyContent="center">
                <Box m={1}>
                  <Button color="secondary" variant="contained" onClick={() => history.goBack()}>
                    Cancel
                  </Button>
                </Box>
                <Box m={1}>
                  <Button disabled={isValid} color="primary" variant="contained" onClick={sendClicked}>
                    Submit
                  </Button>
                </Box>
              </Grid>
            </Box>
          </Grid>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default VerifyCode;
