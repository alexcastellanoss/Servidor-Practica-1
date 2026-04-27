import Client from '../models/Client.js';
import User from '../models/User.js';
import { AppError } from '../utils/AppError.js';

export const createClient = async (req, res) => {
    const { name, cif, email, phone, address } = req.body;

    const user = await User.findById(req.user.id);

    if (!user.company) {
        throw AppError.badRequest('Debes tener una compañía asociada para crear clientes');
    }

    const existingClient = await Client.findOne({
        cif,
        company: user.company
    });

    if (existingClient) {
        throw AppError.conflict('Ya existe un cliente con ese CIF en tu compañía');
    }

    const client = await Client.create({
        user: req.user.id,
        company: user.company,
        name,
        cif,
        email,
        phone,
        address
    });

    res.status(201).json({ data: client });
};

export const updateClient = async (req, res) => {
    const { id } = req.params;
    const { name, cif, email, phone, address } = req.body;

    const user = await User.findById(req.user.id);

    const client = await Client.findOne({
        _id: id,
        company: user.company
    });

    if (!client) {
        throw AppError.notFound('Cliente');
    }

    if (cif && cif !== client.cif) {
        const existingClient = await Client.findOne({
            cif,
            company: user.company,
            _id: { $ne: id }
        });

        if (existingClient) {
            throw AppError.conflict('Ya existe un cliente con ese CIF en tu compañía');
        }
    }

    const updatedClient = await Client.findByIdAndUpdate(
        id,
        { name, cif, email, phone, address },
        { new: true, runValidators: true }
    );

    res.json({ data: updatedClient });
};

export const getClients = async (req, res) => {
    const { page, limit, name, sort } = req.query;

    const user = await User.findById(req.user.id);

    const filter = { company: user.company };

    if (name) {
        filter.name = { $regex: name, $options: 'i' };
    }

    const skip = (page - 1) * limit;

    const [clients, totalItems] = await Promise.all([
        Client.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(limit),
        Client.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    res.json({
        data: clients,
        pagination: {
            currentPage: page,
            totalPages,
            totalItems,
            itemsPerPage: limit
        }
    });
};

export const getClient = async (req, res) => {
    const { id } = req.params;

    const user = await User.findById(req.user.id);

    const client = await Client.findOne({
        _id: id,
        company: user.company
    });

    if (!client) {
        throw AppError.notFound('Cliente');
    }

    res.json({ data: client });
};

export const deleteClient = async (req, res) => {
    const { id } = req.params;
    const { soft } = req.query;

    const user = await User.findById(req.user.id);

    const client = await Client.findOne({
        _id: id,
        company: user.company
    }).setOptions({ withDeleted: true });

    if (!client) {
        throw AppError.notFound('Cliente');
    }

    if (soft === 'true') {
        await Client.softDeleteById(id, req.user.id);
        res.json({ message: 'Cliente archivado correctamente' });
    } else {
        await Client.hardDelete(id);
        res.json({ message: 'Cliente eliminado correctamente' });
    }
};

export const getArchivedClients = async (req, res) => {
    const user = await User.findById(req.user.id);

    const clients = await Client.findDeleted({ company: user.company });

    res.json({ data: clients });
};

export const restoreClient = async (req, res) => {
    const { id } = req.params;

    const user = await User.findById(req.user.id);

    const client = await Client.findOne({
        _id: id,
        company: user.company,
        deleted: true
    }).setOptions({ withDeleted: true });

    if (!client) {
        throw AppError.notFound('Cliente archivado');
    }

    await Client.restoreById(id);

    res.json({ message: 'Cliente restaurado correctamente' });
};