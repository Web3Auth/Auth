/* eslint-disable @typescript-eslint/no-unused-vars */
import { useContext, useEffect } from "react";

import { useHistory } from "react-router-dom";

import { makeStyles } from "@material-ui/core/styles";

import Typography from "@material-ui/core/Typography";
import Grid from "@material-ui/core/Grid";
import Box from "@material-ui/core/Box";
import Button from "@material-ui/core/Button";
import GitHubIcon from "@material-ui/icons/GitHub";

import { AuthContext } from "../contexts/authContext";
import openlogin, { loginWithOpenlogin } from "../openlogin";

const useStyles = makeStyles(() => ({
  root: {},
  title: {
    textAlign: "center",
  },
  session: {
    width: "80vw",
    overflow: "auto",
    overflowWrap: "break-word",
    fontSize: "16px",
  },
  hero: {
    width: "100%",
    background: "rgb(220,220,220)",
  },
}));

export default function Home() {
  const auth = useContext(AuthContext);
  const history = useHistory();
  const classes = useStyles();

  async function handleSignout() {
    if (openlogin.privKey) {
      await openlogin.logout({ fastLogin: true });
    }
    auth.setSessionInfo({});
    auth.signOut();
    history.push("/");
  }
  useEffect(() => {
    async function doLogin() {
      try {
        console.log("auth.sessionInfo.idToken", auth.sessionInfo.idToken);
        if (auth.sessionInfo?.idToken) {
          await openlogin.init();
          console.log("openlogin.privKey", openlogin.privKey);
          if (openlogin.privKey) {
            auth.setOpenloginKey(openlogin.privKey);
          } else {
            await loginWithOpenlogin(auth.sessionInfo.idToken);
          }
        }
      } catch (error) {
        console.log("error while login", error);
        await handleSignout();
      }
    }
    doLogin();
  }, [auth.sessionInfo.idToken]);

  return (
    <Grid container>
      <Grid className={classes.root} container direction="column" justifyContent="center" alignItems="center">
        <Box className={classes.hero} p={4}>
          <Grid className={classes.root} container direction="column" justifyContent="center" alignItems="center">
            <Box m={2}>
              <Grid container direction="row" justifyContent="center" alignItems="center">
                <Box mr={3}>
                  <GitHubIcon fontSize="large" />
                </Box>
                <Typography className={classes.title} variant="h3">
                  AWS Cognito Starter X Openlogin
                </Typography>
              </Grid>
            </Box>
            <Box m={2}>
              <Button onClick={handleSignout} variant="contained" color="primary">
                Sign Out
              </Button>
            </Box>
          </Grid>
        </Box>
        <Box m={2}>
          <Typography variant="h5">Openlogin Key</Typography>
          <pre className={classes.session}>{auth.privateKey}</pre>
        </Box>
        <Box m={2}>
          <Typography variant="h5">Session Info</Typography>
          <pre className={classes.session}>{JSON.stringify(auth.sessionInfo, null, 2)}</pre>
        </Box>
        <Box m={2}>
          <Typography variant="h5">User Attributes</Typography>
          <pre className={classes.session}>{JSON.stringify(auth.attrInfo, null, 2)}</pre>
        </Box>
      </Grid>
    </Grid>
  );
}
