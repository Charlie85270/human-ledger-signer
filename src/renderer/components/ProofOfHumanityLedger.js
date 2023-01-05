import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useReducer,
} from "react";
import TransportWebUSB from "@ledgerhq/hw-transport-webusb";
import getDeviceInfo from "@ledgerhq/live-common/lib/hw/getDeviceInfo";
import genuineCheck from "@ledgerhq/live-common/lib/hw/genuineCheck";
import { open, registerTransportModule } from "@ledgerhq/live-common/lib/hw";
import { from, defer } from "rxjs";
import styled from "styled-components";
import ledgerLogo from "./ledger.png";
import checkLogo from "./check.svg";
import { Inspector } from "react-inspector";

const webusbDevices = {};
const Container = styled.div`
  display: flex;
  flex-direction: column;
  font-family: "Trebuchet MS", "Lucida Sans Unicode", "Lucida Grande",
    "Lucida Sans", Arial, sans-serif;
  background-color: white;
  padding: 16px;
  border-radius: 12px;
  box-shadow: 0 14px 30px -4px rgb(12 32 212 / 7%);
`;

const ImgContainer = styled.div`
  display: flex;
  justify-content: center;
  flex-direction: row;
  padding: 16px;
`;

const H3 = styled.h3`
  text-align: center;
  font-weight: 600;
`;

const CheckContainer = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  color: #08bf08;
`;

const Button = styled.button`
  border-radius: 10px;
  background-color: #6309ff;
  width: auto;
  display: inline-block;
  border: 0;
  line-height: inherit;
  text-decoration: none;
  cursor: pointer;
  padding: 12px 20px 12px 20px;
  color: white;
  font-size: 16px;
  font-weight: 600;
  text-align: center;
  &:hover {
    background-color: #5008cc;
  }
`;

const Log = styled.pre`
  display: flex;
  border-radius: 4px;
  background-color: black;
  flex-direction: row;
  word-break: break-all;
  white-space: pre-line;
  color: white;
  padding: 10px;
  margin: 0;
`;

let id = 0;

const mapDeviceInfo = (args, { deviceInfo }) => [deviceInfo, ...args];
const command = {
  id: "genuineCheck",
  exec: genuineCheck,
  mapArgs: mapDeviceInfo,
  dependencies: {
    deviceInfo: getDeviceInfo,
  },
  form: [],
};

const getDefaultValue = form => {
  if (Array.isArray(form)) {
    return form.map(getDefaultValue);
  }
  if (typeof form.type === "string") {
    return form.default;
  }
  const copy = {};
  for (const key in form) {
    copy[key] = getDefaultValue(form[key]);
  }
  return copy;
};

const execCommand = (c, transport, value, dependencies) => {
  console.log("exec: " + c.id, value);
  transport.setScrambleKey("B0L0S");
  const mapArgs = c.mapArgs || defaultMapArgs;
  return c.exec(transport, ...mapArgs(value, dependencies));
};

const resolveDependencies = (c, transport) => {
  const deps = c.dependencies || {};
  return Object.keys(deps).reduce(
    (p, k) =>
      p.then(obj =>
        deps[k](transport).then(value => ({
          ...obj,
          [k]: value,
        }))
      ),
    Promise.resolve({})
  );
};

const ProofOfHumanityLedger = ({ showLog, onGenuineCheckOver }) => {
  const transportMode = "webusb";
  const [transport, setTransport] = useState(null);
  const [transportOpening, setTransportOpening] = useState(false);
  const [commandValue, setCommandValue] = useState([]);
  const [selectedCommand, setSelectedCommand] = useState(null);
  const [isVerifingGenuine, setIsVerifyingGenuine] = useState(false);
  const [isGenuine, setIsGenuine] = useState(false);
  const [commandSub, setCommandSub] = useState(null);
  const [dependencies, setDependencies] = useState(null);
  const [scrambleKey, _] = useState("");
  const [error, setError] = useState();

  useEffect(() => {
    if (transport) {
      transport.setScrambleKey(scrambleKey);
      setSelectedCommand(command);
      setCommandValue(getDefaultValue(command.form));
      resolveDependencies(command, transport).then(setDependencies, error => {
        addLogError(error);
        setTransport(null);
        setError(
          "An error occured, please verify that your ledger is connected and unlocked"
        );
      });
    }
  }, [transport]);

  useEffect(() => {
    registerTransportModule({
      id: "webusb",

      open: id => {
        if (id.startsWith("webusb")) {
          const existingDevice = webusbDevices[id];
          return existingDevice
            ? TransportWebUSB.open(existingDevice)
            : TransportWebUSB.create();
        }
        return Promise.reject(undefined);
      },

      disconnect: id =>
        id.startsWith("webusb")
          ? Promise.resolve() // nothing to do
          : null,
    });
  }, []);

  const useListenTransportDisconnect = (cb, deps) => {
    const ref = useRef({ cb });
    useEffect(() => {
      ref.current = { cb };
    }, deps);
    return useCallback(
      t => {
        const listener = () => {
          t.off("disconnect", listener);
          ref.current.cb(t);
        };
        t.on("disconnect", listener);
      },
      [ref]
    );
  };

  const [logs, dispatch] = useReducer((logs, action) => {
    switch (action.type) {
      case "ADD":
        return [...logs, { id: ++id, date: new Date(), ...action.payload }];
      case "CLEAR":
        return [];
      default:
        return logs;
    }
  }, []);

  const addLog = useCallback(
    log => dispatch({ type: "ADD", payload: log }),
    [dispatch]
  );
  const clearLogs = useCallback(() => dispatch({ type: "CLEAR" }), [dispatch]);
  const addLogError = error =>
    addLog({
      type: "error",
      text:
        (error && error.name && error.name !== "Error"
          ? error.name + ": "
          : "") + String((error && error.message) || error),
    });

  const listenTransportDisconnect = useListenTransportDisconnect(
    t => {
      if (transport === t) {
        setTransport(undefined);
        clearLogs();
      }
    },
    [transport]
  );

  const logsViewRef = useRef(null);

  useEffect(() => {
    if (logsViewRef.current) {
      logsViewRef.current.scrollTo(0, logsViewRef.current.scrollHeight);
    }
  }, [logs]);
  const onVerifyGenuine = useCallback(() => {
    if (!selectedCommand || !transport) return;
    setIsVerifyingGenuine(true);
    transport.setScrambleKey("B0L0S");
    try {
      addLog({
        type: "command",
        text: "=> " + selectedCommand.id,
      });
      commandValue.forEach(object =>
        addLog({
          type: "command",
          text: "+ ",
          object,
        })
      );
      const startTime = Date.now();
      setCommandSub(
        defer(() =>
          from(
            execCommand(selectedCommand, transport, commandValue, dependencies)
          )
        ).subscribe({
          next: result => {
            addLog({
              type: "command",
              text: "<=",
              object: result,
            });
            if (result.type === "result") {
              if (result.payload === "0000") {
                setIsGenuine(true);
                if (onGenuineCheckOver) {
                  onGenuineCheckOver(true);
                }
              } else {
                if (onGenuineCheckOver) {
                  onGenuineCheckOver(false);
                }
              }
            }
          },
          complete: () => {
            setCommandSub(null);
            setIsVerifyingGenuine(false);
            const d = Date.now() - startTime;
            const delta = d < 1000 ? d + "ms" : (d / 1000).toFixed(1) + "s";
            addLog({
              type: "command",
              text: `${selectedCommand.id} completed in ${delta}.`,
            });
          },
          error: error => {
            setCommandSub(null);
            setError(
              "An error occured, please verify that your ledger is connected and unlocked"
            );
            setTransport(null);
            addLogError(error);
          },
        })
      );
    } catch (error) {
      setIsVerifyingGenuine(false);
    }
  }, [commandValue, transport, selectedCommand, dependencies]);

  const onOpenTransport = useCallback(() => {
    setTransportOpening(true);
    setTransport(undefined);
    open(transportMode).then(
      t => {
        setTransportOpening(false);
        setTransport(t);
        setError(undefined);
        listenTransportDisconnect(t);
      },
      error => {
        setTransportOpening(false);
        clearLogs();
        console.warn(error);
      }
    );
  }, [transportMode, listenTransportDisconnect]);

  const FOOTER = transport ? (
    <Button disabled={isVerifingGenuine} onClick={onVerifyGenuine}>
      {isVerifingGenuine ? "Verifying..." : "Verify"}
    </Button>
  ) : (
    <Button disabled={transportOpening} onClick={onOpenTransport}>
      {transportOpening ? "Connecting..." : "Connect my ledger"}
    </Button>
  );

  return (
    <Container>
      <H3>
        {transport ? (
          <CheckContainer>
            <img
              width="30"
              style={{ marginRight: "8px" }}
              src={checkLogo}
            ></img>
            {isGenuine ? "Your device is authentic !" : "Device connected"}
          </CheckContainer>
        ) : (
          "To verify that you're not a robot, please connect your ledger device via USB."
        )}
      </H3>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {showLog && logs && logs.length > 0 ? (
        <div
          ref={logsViewRef}
          style={{
            flex: 1,
            maxHeight: "400px",
            overflowY: "scroll",
            padding: "20px 10px",
          }}
        >
          {logs.map(log => (
            <Log log={log} key={log.id}>
              {log.text}
              {log.object ? " " : ""}
              {log.object ? (
                <Inspector theme="chromeDark" data={log.object} />
              ) : null}
            </Log>
          ))}
        </div>
      ) : (
        <div>
          <ImgContainer>
            <img height="300px" src={ledgerLogo}></img>
          </ImgContainer>
          <p>
            We'll proceed a genuine check to ensure that your ledger device is a
            real one and you're not a robot. Get more information on what is a
            genuime check{" "}
            <a
              target="_blank"
              href="https://support.ledger.com/hc/en-us/articles/4404382029329-Check-hardware-integrity?support=true"
            >
              here
            </a>
          </p>
        </div>
      )}

      {!isGenuine && FOOTER}
    </Container>
  );
};

export default ProofOfHumanityLedger;
