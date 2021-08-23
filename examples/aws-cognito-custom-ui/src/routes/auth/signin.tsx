import React, { useState, useContext } from "react";

import { useHistory } from "react-router-dom";

import { makeStyles } from "@material-ui/core/styles";
import Box from "@material-ui/core/Box";
import Grid from "@material-ui/core/Grid";
import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";
import Paper from "@material-ui/core/Paper";

import { useValidPassword, useValidEmail } from "../../hooks/useAuthHooks";
import { Email, Password } from "../../components/authComponents";

import { AuthContext } from "../../contexts/authContext";

const useStyles = makeStyles({
  root: {
    height: "100vh",
  },
  hover: {
    "&:hover": { cursor: "pointer" },
  },
});

const SignIn: React.FunctionComponent<{}> = () => {
  const classes = useStyles();

  const { email, setEmail, emailIsValid } = useValidEmail("");
  const { password, setPassword, passwordIsValid } = useValidPassword("");
  const [error, setError] = useState("");

  const isValid = !emailIsValid || email.length === 0 || !passwordIsValid || password.length === 0;

  const history = useHistory();

  const authContext = useContext(AuthContext);

  const signInClicked = async () => {
    try {
      await authContext.signInWithEmail(email, password);
      history.push("home");
    } catch (err) {
      if (err.code === "UserNotConfirmedException") {
        history.push("verify");
      } else {
        setError(err.message);
      }
    }
  };
  return (
    <Grid className={classes.root} container direction="row" justifyContent="center" alignItems="center">
      <Grid xs={11} sm={6} lg={4} container direction="row" justifyContent="center" alignItems="center" item>
        <Paper style={{ width: "100%", padding: 32 }}>
          <Grid container direction="column" justifyContent="center" alignItems="center">
            {/* Title */}
            <Box m={2}>
              <Typography variant="h3">Sign in</Typography>
            </Box>

            {/* Sign In Form */}
            <Box width="80%" m={1}>
              <Email emailIsValid={emailIsValid} setEmail={setEmail} />
              {/* <Username usernameIsValid={emailIsValid} setUsername={setEmail} />{" "} */}
            </Box>
            <Box width="80%" m={1}>
              <Password label="Password" passwordIsValid={passwordIsValid} setPassword={setPassword} />
            </Box>

            {/* Error */}
            <Box mt={2}>
              <Typography color="error" variant="body2">
                {error}
              </Typography>
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
                  <Button disabled={isValid} color="primary" variant="contained" onClick={signInClicked}>
                    Sign In
                  </Button>
                </Box>
              </Grid>
            </Box>
            <Box mt={2}>
              <Box onClick={() => history.push("signup")}>
                <Typography className={classes.hover} variant="body1">
                  Register a new account
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default SignIn;
