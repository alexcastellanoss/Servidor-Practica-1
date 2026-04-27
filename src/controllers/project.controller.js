import Project from '../models/Project.js';
import Client from '../models/Client.js';
import User from '../models/User.js';
import { AppError } from '../utils/AppError.js';

export const createProject = async (req, res) => {
    const { client, name, projectCode, address, email, notes, active } = req.body;

    const user = await User.findById(req.user.id);

    if (!user.company) {
        throw AppError.badRequest('Debes tener una compañía asociada para crear proyectos');
    }

    const clientExists = await Client.findOne({
        _id: client,
        company: user.company
    });

    if (!clientExists) {
        throw AppError.notFound('Cliente');
    }

    const existingProject = await Project.findOne({
        projectCode,
        company: user.company
    });

    if (existingProject) {
        throw AppError.conflict('Ya existe un proyecto con ese código en tu compañía');
    }

    const project = await Project.create({
        user: req.user.id,
        company: user.company,
        client,
        name,
        projectCode,
        address,
        email,
        notes,
        active
    });

    const populatedProject = await Project.findById(project._id).populate('client');

    res.status(201).json({ data: populatedProject });
};

export const updateProject = async (req, res) => {
    const { id } = req.params;
    const { client, name, projectCode, address, email, notes, active } = req.body;

    const user = await User.findById(req.user.id);

    const project = await Project.findOne({
        _id: id,
        company: user.company
    });

    if (!project) {
        throw AppError.notFound('Proyecto');
    }

    if (client) {
        const clientExists = await Client.findOne({
            _id: client,
            company: user.company
        });

        if (!clientExists) {
            throw AppError.notFound('Cliente');
        }
    }

    if (projectCode && projectCode !== project.projectCode) {
        const existingProject = await Project.findOne({
            projectCode,
            company: user.company,
            _id: { $ne: id }
        });

        if (existingProject) {
            throw AppError.conflict('Ya existe un proyecto con ese código en tu compañía');
        }
    }

    const updatedProject = await Project.findByIdAndUpdate(
        id,
        { client, name, projectCode, address, email, notes, active },
        { new: true, runValidators: true }
    ).populate('client');

    res.json({ data: updatedProject });
};

export const getProjects = async (req, res) => {
    const { page, limit, name, client, active, sort } = req.query;

    const user = await User.findById(req.user.id);

    const filter = { company: user.company };

    if (name) {
        filter.name = { $regex: name, $options: 'i' };
    }

    if (client) {
        filter.client = client;
    }

    if (active !== undefined) {
        filter.active = active;
    }

    const skip = (page - 1) * limit;

    const [projects, totalItems] = await Promise.all([
        Project.find(filter)
            .populate('client')
            .sort(sort)
            .skip(skip)
            .limit(limit),
        Project.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    res.json({
        data: projects,
        pagination: {
            currentPage: page,
            totalPages,
            totalItems,
            itemsPerPage: limit
        }
    });
};

export const getProject = async (req, res) => {
    const { id } = req.params;

    const user = await User.findById(req.user.id);

    const project = await Project.findOne({
        _id: id,
        company: user.company
    }).populate('client');

    if (!project) {
        throw AppError.notFound('Proyecto');
    }

    res.json({ data: project });
};

export const deleteProject = async (req, res) => {
    const { id } = req.params;
    const { soft } = req.query;

    const user = await User.findById(req.user.id);

    const project = await Project.findOne({
        _id: id,
        company: user.company
    }).setOptions({ withDeleted: true });

    if (!project) {
        throw AppError.notFound('Proyecto');
    }

    if (soft === 'true') {
        await Project.softDeleteById(id, req.user.id);
        res.json({ message: 'Proyecto archivado correctamente' });
    } else {
        await Project.hardDelete(id);
        res.json({ message: 'Proyecto eliminado correctamente' });
    }
};

export const getArchivedProjects = async (req, res) => {
    const user = await User.findById(req.user.id);

    const projects = await Project.findDeleted({ company: user.company }).populate('client');

    res.json({ data: projects });
};

export const restoreProject = async (req, res) => {
    const { id } = req.params;

    const user = await User.findById(req.user.id);

    const project = await Project.findOne({
        _id: id,
        company: user.company,
        deleted: true
    }).setOptions({ withDeleted: true });

    if (!project) {
        throw AppError.notFound('Proyecto archivado');
    }

    await Project.restoreById(id);

    res.json({ message: 'Proyecto restaurado correctamente' });
};