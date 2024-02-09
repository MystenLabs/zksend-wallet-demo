import {
  ConnectButton,
  useSignAndExecuteTransactionBlock,
  useCurrentAccount,
} from "@mysten/dapp-kit";
import { Box, Button, Container, Flex, Heading } from "@radix-ui/themes";
import { ZkSendLinkBuilder } from "@mysten/zksend";
import { useMutation } from "@tanstack/react-query";
import { FUD_TYPE, ZK_SEND_HOST } from "./constants";
import { useState } from "react";
import {
  MIST_PER_SUI,
  SUI_TYPE_ARG,
  isValidSuiAddress,
  normalizeSuiAddress,
} from "@mysten/sui.js/utils";

function App() {
  const address = useCurrentAccount()?.address;
  const signAndExecute = useSignAndExecuteTransactionBlock();
  const [coinType, setCoinType] = useState(FUD_TYPE);
  const [balances, setBalances] = useState<Record<string, bigint>>({});
  const [nfts, setNfts] = useState<string[]>([]);

  const createLink = useMutation({
    mutationFn: async () => {
      const link = new ZkSendLinkBuilder({
        sender: address!,
        host: ZK_SEND_HOST,
        redirect: {
          url: window.location.href,
          name: "zkSend Wallet Demo",
        },
      });

      for (const [type, amount] of Object.entries(balances)) {
        link.addClaimableBalance(type, amount);
      }

      for (const nft of nfts) {
        link.addClaimableObject(nft);
      }

      const txb = await link.createSendTransaction();

      await signAndExecute.mutateAsync({
        transactionBlock: txb,
      });

      const url = link.getLink();
      console.log(url);

      window.location.assign(url);
    },
  });

  return (
    <>
      <Flex
        position="sticky"
        px="4"
        py="2"
        justify="between"
        style={{
          borderBottom: "1px solid var(--gray-a2)",
        }}
      >
        <Box>
          <Heading>dApp Starter Template</Heading>
        </Box>

        <Box>
          <ConnectButton />
        </Box>
      </Flex>
      <Container>
        <Container
          mt="5"
          pt="2"
          px="4"
          style={{ background: "var(--gray-a2)", minHeight: 500 }}
        >
          {createLink.isError && (
            <Box style={{ color: "red" }}>
              <pre>{createLink.error?.stack}</pre>
            </Box>
          )}

          <Box>
            <Heading>Add Sui</Heading>
            <label>
              Amount:
              <input id="sui-amount" type="number" defaultValue={0} />
            </label>
            <button
              onClick={async (ev) => {
                ev.preventDefault();
                setBalances({
                  ...balances,
                  [SUI_TYPE_ARG]:
                    (balances[SUI_TYPE_ARG] ?? 0n) +
                    BigInt(
                      Number(
                        (
                          document.getElementById(
                            "sui-amount",
                          ) as HTMLInputElement
                        ).value,
                      ) * Number(MIST_PER_SUI),
                    ),
                });
              }}
            >
              Add
            </button>
          </Box>
          <Box>
            <Heading>Add Coin</Heading>
            <Box>
              <label>
                Coin Type:
                <input
                  id="coin-type"
                  size={80}
                  type="string"
                  value={coinType}
                  onChange={(ev) => setCoinType(ev.target.value)}
                />
              </label>
            </Box>
            <Box>
              <label>
                Amount:
                <input id="coin-amount" type="number" defaultValue={0} />
              </label>
              <button
                onClick={async (ev) => {
                  ev.preventDefault();
                  setBalances({
                    ...balances,
                    [coinType]:
                      (balances[coinType] ?? 0n) +
                      BigInt(
                        (
                          document.getElementById(
                            "coin-amount",
                          ) as HTMLInputElement
                        ).value,
                      ),
                  });
                }}
              >
                Add
              </button>
            </Box>
          </Box>

          <Box>
            <Heading>Add Object</Heading>
            <Box>
              <label>
                Object ID:
                <input id="object-id" size={80} type="string" />
              </label>
              <button
                onClick={async (ev) => {
                  const el = document.getElementById(
                    "object-id",
                  ) as HTMLInputElement;
                  const address = normalizeSuiAddress(el.value);
                  ev.preventDefault();

                  if (isValidSuiAddress(address)) {
                    setNfts([...nfts, address]);
                  }
                  el.value = "";
                }}
              >
                Add
              </button>
            </Box>
          </Box>

          <Box>
            <Heading>Summary</Heading>
            <Box>
              <Heading>Balances</Heading>
              <ul>
                {Object.entries(balances).map(([type, amount]) => (
                  <li key={type}>
                    {type === SUI_TYPE_ARG
                      ? Number(amount) / Number(MIST_PER_SUI)
                      : String(amount)}{" "}
                    {type}
                  </li>
                ))}
              </ul>
            </Box>
            <Box>
              <Heading>NFTs</Heading>
              <ul>
                {nfts.map((nft) => (
                  <li key={nft}>{nft}</li>
                ))}
              </ul>
            </Box>
          </Box>
          <Button
            disabled={nfts.length === 0 && Object.keys(balances).length === 0}
            onClick={() => createLink.mutateAsync()}
          >
            Create Link
          </Button>
        </Container>
      </Container>
    </>
  );
}

export default App;
