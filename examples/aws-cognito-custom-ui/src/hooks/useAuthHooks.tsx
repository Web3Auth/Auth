import { useState, useEffect } from "react";

import * as yup from "yup";

export const useValidEmail = (initialValue: string) => {
  const [email, setEmail] = useState(initialValue);
  const [emailIsValid, setEmailIsValid] = useState(true);

  useEffect(() => {
    const emailSchema = yup.object().shape({
      email: yup.string().email().required(),
    });

    if (email.length === 0) {
      setEmailIsValid(true);
      return;
    }

    const isValid = emailSchema.isValidSync({ email });

    setEmailIsValid(isValid);
  }, [email]);

  return { email, setEmail, emailIsValid };
};

export const useValidPassword = (initialValue: string) => {
  const [password, setPassword] = useState(initialValue);
  const [passwordIsValid, setPasswordIsValid] = useState(true);

  useEffect(() => {
    const passwordSchema = yup.object().shape({
      password: yup.string().min(8).required(),
    });

    if (password.length === 0) {
      setPasswordIsValid(true);
      return;
    }

    const isValid = passwordSchema.isValidSync({ password });

    setPasswordIsValid(isValid);
  }, [password]);

  return { password, setPassword, passwordIsValid };
};

export const useValidCode = (initialValue: string) => {
  const [code, setCode] = useState(initialValue);
  const [codeIsValid, setCodeIsValid] = useState(true);

  useEffect(() => {
    const codeSchema = yup.object().shape({
      code: yup.string().min(6).required(),
    });

    if (code.length === 0) {
      setCodeIsValid(true);
      return;
    }

    const isValid = codeSchema.isValidSync({ code });

    setCodeIsValid(isValid);
  }, [code]);

  return { code, setCode, codeIsValid };
};
