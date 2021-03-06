import { natsWrapper } from '../../../nats-wrapper';
import mongoose, { mongo } from 'mongoose';

import { Ticket } from '../../../models/ticket';
import { OrderCreatedEvent, OrderStatus } from '@lt-ticketing/common';
import { OrderCreatedListener } from '../order-created-listener';
import { updateTicketRouter } from '../../../routes/update';

const setup = async () => {
    const listener = new OrderCreatedListener(natsWrapper.client);

    const ticket = Ticket.build({
        title: 'concert',
        price: 20,
        userId: mongoose.Types.ObjectId().toHexString()
    });
    await ticket.save();

    const data: OrderCreatedEvent['data'] = {
        id: mongoose.Types.ObjectId().toHexString(),
        status: OrderStatus.Created,
        userId: mongoose.Types.ObjectId().toHexString(),
        expiresAt: 'expiretime',
        version: 0,
        ticket: {
            id: ticket.id,
            price: ticket.price
        }
    }

    //@ts-ignore
    const msg: Message = {
        ack: jest.fn()
    }

    return { listener, ticket, data, msg };
}

it('updates the ticket order id property', async () => {
    const { listener, ticket, data, msg } = await setup();

    await listener.onMessage(data, msg);
    const updatedTicket = await Ticket.findById(ticket.id);

    expect(updatedTicket!.orderId).toEqual(data.id);
});

it('acks the message', async () => {
    const { listener, data, msg } = await setup();

    await listener.onMessage(data, msg);
    expect(msg.ack).toHaveBeenCalled();
});

it('publishes a TicketUpdatedEvent to update version #s', async () => {
    const { listener, data, msg } = await setup();

    await listener.onMessage(data, msg);
    expect(natsWrapper.client.publish).toHaveBeenCalled();

    const updatedTicketData = JSON.parse(
        (natsWrapper.client.publish as jest.Mock).mock.calls[0][1]
    );
    expect(updatedTicketData.orderId).toEqual(data.id);
});