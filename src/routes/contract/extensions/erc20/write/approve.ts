import { getBlockExplorerUrl } from "../../../../../utils/other";

import type { FastifyInstance } from "fastify";
import { getSigner } from "../../../../../utils/wallet";
import { ethers } from "ethers";
import { erc20Abi } from "abitype/abis";
import type { TransactionResponse } from "ethers";
import { TransactionService } from "../../../../../services/transaction.service";

type ERC20ApproveRequestBody = {
    spender: string;
    amount: string;
}

type ERC20ApproveRequestParams = {
    chainId: string;
    contractAddress: string;
}

type ERC20ApproveResponse = {
    result?: {
        txHash: string | null;
        txUrl: string | null;
        error?: string;
    };
}

const ERC20ApproveSchema = {
    tags: ['ERC20'],
    body: {
        type: 'object',
        required: ['spender', 'amount'],
        properties: {
            spender: { type: 'string' },
            amount: { type: 'string' }
        }
    },
    params: {
        type: 'object',
        required: ['chainId', 'contractAddress'],
        properties: {
            chainId: { type: 'string' },
            contractAddress: { type: 'string' }
        }
    },
    headers: {
        type: 'object',
        required: ['x-secret-key'],
        properties: {
            'x-secret-key': { type: 'string' },
        }
    },
    response: {
        200: {
            type: 'object',
            properties: {
                result: {
                    type: 'object',
                    properties: {
                        txHash: { type: 'string' },
                        txUrl: { type: 'string' },
                        error: { type: 'string', nullable: true }
                    }
                }
            }
        }
    }
}

export async function erc20Approve(fastify: FastifyInstance) {
    fastify.post<{
        Params: ERC20ApproveRequestParams;
        Body: ERC20ApproveRequestBody;
        Reply: ERC20ApproveResponse;
    }>('/write/erc20/:chainId/:contractAddress/approve', {
        schema: ERC20ApproveSchema
    }, async (request, reply) => {
        try {
            const { spender, amount } = request.body;
            const { chainId, contractAddress } = request.params;

            const signer = await getSigner(chainId);
            const contract = new ethers.Contract(
                contractAddress,
                erc20Abi,
                signer
            );

            const data = contract.interface.encodeFunctionData(
                'approve',
                [spender, amount]
            );

            const tx = {
                to: contractAddress,
                data
            }

            const txService = new TransactionService(fastify);

            // Create pending transaction first
            const pendingTx = await txService.createPendingTransaction({ chainId, contractAddress, data: { functionName: "approve", args: [spender, amount] } });

            const txResponse: TransactionResponse = await signer.sendTransaction(tx);

            // Update transaction status
            await txService.updateTransactionStatus(pendingTx.id, txResponse);

            return reply.code(200).send({
                result: {
                    txHash: txResponse.hash,
                    txUrl: getBlockExplorerUrl(Number(chainId), txResponse.hash)
                }
            });

        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({
                result: {
                    txHash: null,
                    txUrl: null,
                    error: error instanceof Error ? error.message : 'Failed to execute approve'
                }
            });
        }
    });
}

