const Sequelize = require("sequelize");

const { User, Event, Attendee, NonRegisteredAttendee } = require("../db/db");

const create_event = async (req, res) => {
  const { eventName, numberOfSlots, date, time } = req.body;
  const hostId = req.user.userId;

  try {
    const event = await Event.create({
      eventName,
      size: numberOfSlots,
      date,
      time,
    });

    await Attendee.create({
      userId: hostId,
      eventId: event.id,
      role: "host",
    });

    res.status(201).send(event);
  } catch (error) {
    console.error("Error creating event: ", error);
    res.status(500).send("Error creating event");
  }
};

const delete_event = async (req, res) => {
  const { event_id } = req.body;
  try {
    await Event.destroy({
      where: {
        id: event_id,
      },
    });
    res.status(200).send("Event deleted");
  } catch (error) {
    console.error("Error deleting event: ", error);
    res.status(500).send("Error deleting event");
  }
};

const edit_event = async (req, res) => {};

const update_attendance = async (req, res) => {};

const get_events = async (req, res) => {
  const userId = req.user.userId;

  try {
    const events = await Event.findAll({
      attributes: ["eventName", "date", "time", "size"],
      include: [
        {
          model: Attendee,
          attributes: ["role"],
          include: [
            {
              model: User,
              attributes: ["name"],
            },
          ],
          required: false,
        },
        {
          model: NonRegisteredAttendee,
          attributes: ["name"],
          required: false,
        },
      ],
    });

    const formattedEvents = events.map((event) => {
      const attendees = [
        ...event.Attendees.map((attendee) => ({
          name: attendee.User.name,
          role: attendee.role,
        })),
        ...event.NonRegisteredAttendees.map((attendee) => ({
          name: attendee.name,
          role: "attendee",
        })),
      ];

      while (attendees.length < event.size) {
        attendees.push({
          name: "empty",
          role: "add user",
        });
      }

      return {
        eventName: event.eventName,
        date: event.date,
        time: event.time,
        size: event.size,
        attendees,
      };
    });

    console.log("attendees: ", formattedEvents[0].attendees);

    res.status(200).send(formattedEvents);
  } catch (error) {
    console.error("Error getting events: ", error);
    res.status(500).send("Error getting events");
  }
};

const get_event = async (req, res) => {
  const { eventId } = req.params;
  try {
    const event = await Event.findByPk(eventId, {
      attributes: ["eventName", "date", "time", "size"],
      include: [
        {
          model: Attendee,
          attributes: ["role"],
          include: [
            {
              model: User,
              attributes: ["name"],
            },
          ],
          required: false,
        },
        {
          model: NonRegisteredAttendee,
          attributes: ["name"],
          required: false,
        },
      ],
    });

    if (event) {
      const attendees = [
        ...event.Attendees.map((attendee) => ({
          name: attendee.User.name,
          role: attendee.role,
        })),
        ...event.NonRegisteredAttendees.map((attendee) => ({
          name: attendee.name,
          role: "attendee",
        })),
      ];

      while (attendees.length < event.size) {
        attendees.push({
          name: "empty",
          role: "add user",
        });
      }

      res.json({
        eventName: event.eventName,
        date: event.date,
        time: event.time,
        size: event.size,
        attendees,
      });
    } else {
      res.status(404).json({ message: "Event not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  create_event,
  delete_event,
  edit_event,
  update_attendance,
  get_events,
  get_event,
};
