import {
  ConnectButton,
  useSuiClientQuery,
  useSignAndExecuteTransactionBlock,
  useCurrentAccount,
  // useSuiClient,
} from "@mysten/dapp-kit";
import { Box, Container, Flex, Heading } from "@radix-ui/themes";
import { ZkSendLinkBuilder } from "@mysten/zksend";
import { useMutation } from "@tanstack/react-query";

const FUD_TYPE =
  "0x76cb819b01abed502bee8a702b4c2d547532c12f25001c9dea795a5e631c26f1::fud::FUD";
const ZK_SEND_HOST = window.location.host.includes("localhost")
  ? "http://localhost:3000"
  : "https://preview.zksend.com";

function App() {
  const address = useCurrentAccount()?.address;
  const signAndExecute = useSignAndExecuteTransactionBlock();
  // const client = useSuiClient();

  const createLink = useMutation({
    mutationFn: async (amount: bigint) => {
      const link = new ZkSendLinkBuilder({
        sender: address!,
        host: ZK_SEND_HOST,
      });

      link.addClaimableBalance(FUD_TYPE, amount);

      const txb = await link.createSendTransaction();

      console.log(link.getLink());

      await signAndExecute.mutateAsync({
        transactionBlock: txb,
      });

      window.location.href = link.getLink();
    },
  });

  const balance = useSuiClientQuery(
    "getBalance",
    {
      owner: address!,
      coinType: FUD_TYPE,
    },
    {
      enabled: !!address,
    },
  );

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

          <Box>address: {address}</Box>
          <Box>balance: {balance.data?.totalBalance}</Box>

          <form>
            <label>
              Amount:
              <input
                id="fud-amount"
                type="number"
                step={1}
                min={0}
                defaultValue={100}
                max={balance.data?.totalBalance}
              />
            </label>
            <button
              type="submit"
              onClick={async (ev) => {
                ev.preventDefault();
                createLink.mutate(
                  BigInt(
                    (document.getElementById("fud-amount") as HTMLInputElement)
                      .value,
                  ),
                );
              }}
            >
              Create link
            </button>
          </form>
        </Container>
      </Container>
    </>
  );
}

export default App;
